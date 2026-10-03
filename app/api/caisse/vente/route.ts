import { NextRequest, NextResponse } from 'next/server';
import { getDbDirect } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// POST /api/caisse/vente — enregistre une vente de caisse complète en une
// seule transaction (audit B5). Avant, la caisse décrémentait article par
// article sans vérifier les réponses : un stock insuffisant en milieu de
// panier laissait une vente partielle enregistrée comme un succès.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const modePaiement = body.modePaiement === 'mobile' ? 'Mobile Money' : 'Espèces';
    const nomClient = typeof body.nomClient === 'string' ? body.nomClient.trim().slice(0, 100) : '';

    if (items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: 'Panier vide ou trop volumineux' }, { status: 400 });
    }
    for (const item of items) {
      if (
        !item ||
        typeof item.articleId !== 'string' ||
        !Number.isInteger(item.quantite) ||
        item.quantite < 1 ||
        item.quantite > 999
      ) {
        return NextResponse.json({ error: 'Quantité invalide dans le panier' }, { status: 400 });
      }
    }

    const motif = `Caisse ${modePaiement}${nomClient ? ` • ${nomClient}` : ''}`;

    try {
      await getDbDirect().$transaction(async (tx) => {
        for (const item of items) {
          // Vérifie l'appartenance et le stock en une écriture atomique.
          const res = await tx.article.updateMany({
            where: { id: item.articleId, userId: user.id, quantite: { gte: item.quantite } },
            data: { quantite: { decrement: item.quantite } },
          });
          if (res.count === 0) {
            const article = await tx.article.findUnique({
              where: { id: item.articleId },
              select: { nom: true },
            });
            throw new Error(`STOCK_INSUFFISANT:${article?.nom ?? item.articleId}`);
          }
          await tx.mouvement.create({
            data: {
              articleId: item.articleId,
              type: 'SORTIE',
              quantite: item.quantite,
              prixUnitaire: Math.round(item.prixUnitaire ?? 0),
              note: motif,
            },
          });
        }
      });
    } catch (txError) {
      const msg = txError instanceof Error ? txError.message : '';
      const match = msg.match(/STOCK_INSUFFISANT:(.+)/);
      if (match) {
        return NextResponse.json(
          { error: `Stock insuffisant pour « ${match[1]} » — vente annulée, rien n'a été enregistré.` },
          { status: 409 }
        );
      }
      throw txError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur vente caisse:', error);
    return NextResponse.json({ error: 'Erreur lors de la validation de la vente' }, { status: 500 });
  }
}
