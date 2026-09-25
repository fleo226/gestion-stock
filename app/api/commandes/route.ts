import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// === GET : liste des commandes du vendeur connecté ===
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const commandes = await db.commande.findMany({
      where: { vendeurId: userId },
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

// === POST : créer OU valider une commande ===
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // === Action: valider une commande (côté vendeur) ===
    if (body.action === 'validate') {
      const { commandeId } = body;
      if (!commandeId) {
        return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
      }

      const cookieStore = await cookies();
      const userId = cookieStore.get('userId')?.value;
      if (!userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }

      const commande = await db.commande.findFirst({
        where: { id: commandeId, vendeurId: userId },
      });
      if (!commande) {
        return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
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

    // === Action: créer une commande (côté client) ===
    const { vendeurId, clientNom, clientTel, clientAdresse, clientNote, items } = body;

    if (!vendeurId || !clientNom?.trim() || !items?.length) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier que le vendeur existe
    const vendeur = await db.user.findUnique({ where: { id: vendeurId } });
    if (!vendeur) {
      return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
    }

    // Vérifier le stock + calculer le total
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
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

    // === Créer la Commande en DB ===
    const commande = await db.commande.create({
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

    // === Décrémenter le stock + créer les mouvements SORTIE ===
    for (const item of validatedItems) {
      const article = await db.article.findUnique({ where: { id: item.articleId } });
      if (article) {
        await db.mouvement.create({
          data: {
            articleId: item.articleId,
            type: 'SORTIE',
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
            note: `Commande ${commande.id.slice(0, 8).toUpperCase()} : ${clientNom}${clientTel ? ` (${clientTel})` : ''}`,
          },
        });
        await db.article.update({
          where: { id: item.articleId },
          data: { quantite: article.quantite - item.quantite },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: commande.id },
    });
  } catch (error) {
    console.error('Erreur POST commandes:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
