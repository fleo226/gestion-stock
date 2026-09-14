import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendeurId: string }> }
) {
  try {
    const { vendeurId } = await params;

    const user = await db.user.findUnique({
      where: { id: vendeurId },
      select: { id: true, nom: true, couleur: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
    }

    const articles = await db.article.findMany({
      where: {
        userId: vendeurId,
        quantite: { gt: 0 },
      },
      include: { categorie: true },
      orderBy: { creeLe: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        vendeur: { nom: user.nom, couleur: user.couleur },
        articles: articles.map(a => ({
          id: a.id,
          nom: a.nom,
          taille: a.taille,
          couleur: a.couleur,
          prixAchat: a.prixAchat,
          prixVente: a.prixVente,
          quantite: a.quantite,
          unite: a.unite,
          photoUrl: a.photoUrl,
          categorie: a.categorie ? { nom: a.categorie.nom, couleur: a.categorie.couleur } : null,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur GET boutique:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}