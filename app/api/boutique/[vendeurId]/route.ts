import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// =====================================================
// API /api/boutique/[vendeurId]
// GET : Récupère les infos boutique publique + articles
// Utilisé par la page /boutique/[vendeurId] (vue cliente)
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendeurId: string }> }
) {
  try {
    const { vendeurId } = await params;

    const user = await db.user.findUnique({
      where: { id: vendeurId },
      select: {
        id: true,
        nom: true,
        couleur: true,
        boutiqueNom: true,
        boutiqueSlug: true,
        boutiqueDescription: true,
        boutiqueLogoUrl: true,
        boutiqueWhatsApp: true,
        boutiqueActive: true,
        boutiqueAccentColor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
    }

    // Si la boutique n'est pas active, on bloque l'accès
    // (la commerçante peut la désactiver dans /boutique/configurer)
    if (user.boutiqueActive === false) {
      return NextResponse.json({ 
        error: 'Cette boutique est actuellement inactive',
        inactive: true,
      }, { status: 403 });
    }

    const articles = await db.article.findMany({
      where: {
        userId: vendeurId,
        quantite: { gt: 0 },
      },
      include: { categorie: true },
      orderBy: { creeLe: 'desc' },
    });

    // Formatage de la réponse
    return NextResponse.json({
      success: true,
      data: {
        vendeur: {
          id: user.id,
          nom: user.nom,
          couleur: user.couleur,
          // Champs custom boutique (avec fallbacks si pas configurés)
          boutiqueNom: user.boutiqueNom || user.nom,
          boutiqueDescription: user.boutiqueDescription,
          boutiqueLogoUrl: user.boutiqueLogoUrl,
          boutiqueWhatsApp: user.boutiqueWhatsApp,
          boutiqueAccentColor: user.boutiqueAccentColor || user.couleur || '#2563eb',
        },
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
