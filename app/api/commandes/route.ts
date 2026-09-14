import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendeurId, clientNom, clientTel, items } = body;

    if (!vendeurId || !clientNom?.trim() || !items?.length) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier que le vendeur existe
    const vendeur = await db.user.findUnique({ where: { id: vendeurId } });
    if (!vendeur) {
      return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
    }

    // Vérifier le stock pour chaque article
    for (const item of items) {
      const article = await db.article.findUnique({ where: { id: item.articleId } });
      if (!article || article.quantite < item.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant pour l'article ${article?.nom || item.articleId}` },
          { status: 400 }
        );
      }
    }

    // Créer la commande - décrémenter le stock et créer les mouvements SORTIE
    for (const item of items) {
      const article = await db.article.findUnique({ where: { id: item.articleId } });
      
      if (!article) {
        return NextResponse.json(
          { error: `Article introuvable : ${item.articleId}` },
          { status: 404 }
        );
      }

      // Créer le mouvement de sortie
      await db.mouvement.create({
        data: {
          articleId: item.articleId,
          type: 'SORTIE',
          quantite: item.quantite,
          prixUnitaire: article.prixVente,
          note: `Commande client : ${clientNom}${clientTel ? ` (${clientTel})` : ''}`,
        },
      });

      // Décrémenter le stock
      await db.article.update({
        where: { id: item.articleId },
        data: { quantite: article.quantite - item.quantite },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Commande confirmée et stock mis à jour',
    });
  } catch (error) {
    console.error('Erreur POST commandes:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}