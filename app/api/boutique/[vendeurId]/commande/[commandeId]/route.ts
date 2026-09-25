import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/boutique/[vendeurId]/commande/[commandeId]
// Public : le client consulte sa commande + instructions OM
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendeurId: string; commandeId: string }> }
) {
  try {
    const { vendeurId, commandeId } = await params;

    // Récupère la commande avec ses lignes
    const commande = await db.commande.findFirst({
      where: { id: commandeId, vendeurId },
      include: {
        lignes: {
          include: {
            article: { select: { id: true, nom: true, taille: true, couleur: true, photoUrl: true } },
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // Récupère la config Orange Money du vendeur
    const vendeur = await db.user.findUnique({
      where: { id: vendeurId },
      select: {
        boutiqueNom: true,
        boutiqueWhatsApp: true,
        boutiqueAccentColor: true,
        orangeMoneyType: true,
        orangeMoneyCodeMarchand: true,
        orangeMoneyNumero: true,
        orangeMoneyNomAffichage: true,
      },
    });

    if (!vendeur) {
      return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        commande: {
          id: commande.id,
          total: commande.total,
          statut: commande.statut,
          creeLe: commande.creeLe,
          clientNom: commande.clientNom,
          reference: commande.id.slice(0, 8).toUpperCase(),
          lignes: commande.lignes.map(l => ({
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            article: l.article,
          })),
        },
        vendeur: {
          boutiqueNom: vendeur.boutiqueNom,
          boutiqueWhatsApp: vendeur.boutiqueWhatsApp,
          boutiqueAccentColor: vendeur.boutiqueAccentColor,
          orangeMoneyType: vendeur.orangeMoneyType,
          orangeMoneyCodeMarchand: vendeur.orangeMoneyCodeMarchand,
          orangeMoneyNumero: vendeur.orangeMoneyNumero,
          orangeMoneyNomAffichage: vendeur.orangeMoneyNomAffichage || vendeur.boutiqueNom,
        },
      },
    });
  } catch (error) {
    console.error('Erreur GET commande:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
