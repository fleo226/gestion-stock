import { NextRequest, NextResponse } from 'next/server';
import { db, getDbDirect } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { annulerCommande, expirerCommandesPerimees } from '@/lib/commandes';

// === GET : liste des commandes du vendeur connecté ===
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Audit B1 : les commandes non payées depuis plus de 2h libèrent le stock
    await expirerCommandesPerimees();

    const commandes = await db.commande.findMany({
      where: { vendeurId: user.id },
      include: {
        lignes: {
          include: {
            article: { select: { id: true, nom: true, taille: true, couleur: true, photoUrl: true } },
          },
        },
      },
      orderBy: { creeLe: 'desc' },
    });

    return NextResponse.json({ success: true, data: commandes });
  } catch (error) {
    console.error('Erreur GET commandes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// === POST : créer / valider / annuler / déclarer un paiement ===
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // === Action: valider une commande (côté vendeur) ===
    if (body.action === 'validate') {
      const { commandeId } = body;
      if (!commandeId) {
        return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
      }

      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }

      const commande = await db.commande.findFirst({
        where: { id: commandeId, vendeurId: user.id },
      });
      if (!commande) {
        return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
      }
      // Audit B6 : on ne valide que ce qui est en attente de validation/paiement
      if (commande.statut !== 'EN_ATTENTE_VALIDATION' && commande.statut !== 'EN_ATTENTE_PAIEMENT') {
        return NextResponse.json(
          { error: `Cette commande est déjà ${commande.statut === 'CONFIRMEE' ? 'confirmée' : 'annulée'}` },
          { status: 409 }
        );
      }

      await db.commande.update({
        where: { id: commandeId },
        data: {
          statut: 'CONFIRMEE',
          valideeLe: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Action: annuler une commande (côté vendeur, audit B1) ===
    if (body.action === 'annuler') {
      const { commandeId } = body;
      if (!commandeId) {
        return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
      }

      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }

      const res = await annulerCommande(commandeId, user.id, 'vendeuse');
      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    // === Action: la cliente déclare son paiement Orange Money (audit B2) ===
    if (body.action === 'declare-payment') {
      const { commandeId, reference } = body;
      if (!commandeId || !reference?.trim()) {
        return NextResponse.json(
          { error: "ID commande et référence de transaction requis" },
          { status: 400 }
        );
      }

      const commande = await db.commande.findUnique({ where: { id: commandeId } });
      if (!commande) {
        return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
      }
      if (commande.statut !== 'EN_ATTENTE_PAIEMENT') {
        return NextResponse.json(
          { error: "Cette commande n'est plus en attente de paiement" },
          { status: 409 }
        );
      }

      await db.commande.update({
        where: { id: commandeId },
        data: {
          statut: 'EN_ATTENTE_VALIDATION',
          referencePaiement: reference.trim().slice(0, 100),
        },
      });

      return NextResponse.json({ success: true });
    }

    // === Action: créer une commande (côté client) ===
    const { vendeurId, clientNom, clientTel, clientAdresse, clientNote, items } = body;

    if (!vendeurId || !clientNom?.trim() || !items?.length) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // === Validation des quantités (audit B4) ===
    // Chaque quantité doit être un entier entre 1 et 999. Les doublons
    // d'articles sont agrégés pour que le contrôle de stock porte sur
    // la quantité totale demandée, ligne par ligne et article par article.
    if (!Array.isArray(items) || items.length > 50) {
      return NextResponse.json({ error: 'Panier invalide (50 articles maximum)' }, { status: 400 });
    }
    const quantitesParArticle = new Map<string, number>();
    for (const item of items) {
      if (
        !item ||
        typeof item.articleId !== 'string' ||
        !Number.isInteger(item.quantite) ||
        item.quantite < 1 ||
        item.quantite > 999
      ) {
        return NextResponse.json(
          { error: 'Quantité invalide : un nombre entier entre 1 et 999 est requis pour chaque article' },
          { status: 400 }
        );
      }
      quantitesParArticle.set(item.articleId, (quantitesParArticle.get(item.articleId) || 0) + item.quantite);
    }
    for (const quantite of quantitesParArticle.values()) {
      if (quantite > 999) {
        return NextResponse.json(
          { error: 'Quantité cumulée invalide : 999 maximum par article' },
          { status: 400 }
        );
      }
    }
    const articlesDemandes = Array.from(quantitesParArticle.entries()).map(([articleId, quantite]) => ({
      articleId,
      quantite,
    }));

    // Vérifier que le vendeur existe
    const vendeur = await db.user.findUnique({ where: { id: vendeurId } });
    if (!vendeur) {
      return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
    }

    // Vérifier le stock + calculer le total
    let total = 0;
    const validatedItems: { articleId: string; quantite: number; prixUnitaire: number }[] = [];

    for (const item of articlesDemandes) {
      const article = await db.article.findUnique({ where: { id: item.articleId } });
      if (!article) {
        return NextResponse.json({ error: `Article introuvable` }, { status: 404 });
      }
      if (article.userId !== vendeurId) {
        return NextResponse.json({ error: 'Article non autorisé' }, { status: 403 });
      }
      if (article.quantite < item.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${article.nom} (disponible: ${article.quantite})` },
          { status: 400 }
        );
      }
      total += article.prixVente * item.quantite;
      validatedItems.push({
        articleId: item.articleId,
        quantite: item.quantite,
        prixUnitaire: article.prixVente,
      });
    }

    // === Créer la commande + décrémenter le stock atomiquement (audit B3) ===
    // Transaction interactive sur la connexion en mode SESSION (dbDirect) :
    // si un article n'a plus le stock requis au moment de l'écriture,
    // TOUT est annulé (commande, lignes, décréments déjà faits).
    let commandeId: string;
    try {
      const commande = await getDbDirect().$transaction(async (tx) => {
        const created = await tx.commande.create({
          data: {
            vendeurId,
            clientNom: clientNom.trim(),
            clientTelephone: clientTel?.trim() || null,
            clientAdresse: clientAdresse?.trim() || null,
            clientNote: clientNote?.trim() || null,
            total,
            statut: 'EN_ATTENTE_PAIEMENT',
            lignes: {
              create: validatedItems.map(item => ({
                articleId: item.articleId,
                quantite: item.quantite,
                prixUnitaire: item.prixUnitaire,
              })),
            },
          },
        });

        for (const item of validatedItems) {
          // Décrément conditionnel atomique : la garde quantite >= qte est
          // évaluée par la base au moment de l'écriture. count === 0 =>
          // stock parti entre la vérification et l'écriture → rollback.
          const res = await tx.article.updateMany({
            where: { id: item.articleId, quantite: { gte: item.quantite } },
            data: { quantite: { decrement: item.quantite } },
          });
          if (res.count === 0) {
            throw new Error(`STOCK_INSUFFISANT:${item.articleId}`);
          }
        }

        for (const item of validatedItems) {
          await tx.mouvement.create({
            data: {
              articleId: item.articleId,
              type: 'SORTIE',
              quantite: item.quantite,
              prixUnitaire: item.prixUnitaire,
              note: `Commande ${created.id.slice(0, 8).toUpperCase()} : ${clientNom}${clientTel ? ` (${clientTel})` : ''}`,
            },
          });
        }

        return created;
      });
      commandeId = commande.id;
    } catch (txError) {
      const msg = txError instanceof Error ? txError.message : '';
      const match = msg.match(/STOCK_INSUFFISANT:(.+)/);
      if (match) {
        const nom = await db.article.findUnique({
          where: { id: match[1] },
          select: { nom: true, quantite: true },
        });
        return NextResponse.json(
          { error: `Stock insuffisant pour ${nom?.nom ?? 'un article'} (disponible: ${nom?.quantite ?? 0})` },
          { status: 409 }
        );
      }
      throw txError;
    }

    return NextResponse.json({
      success: true,
      data: { id: commandeId },
    });
  } catch (error) {
    console.error('Erreur POST commandes:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
