import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// =====================================================
// API /api/boutique/moi
// GET  : Récupère les infos boutique du user connecté
// PATCH : Met à jour les infos boutique + Orange Money
// =====================================================

// Helper : récupère l'userId depuis le cookie
async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value ?? null;
}

// === GET ===
export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        email: true,
        boutiqueNom: true,
        boutiqueSlug: true,
        boutiqueDescription: true,
        boutiqueLogoUrl: true,
        boutiqueWhatsApp: true,
        boutiqueActive: true,
        boutiqueAccentColor: true,
        orangeMoneyType: true,
        orangeMoneyCodeMarchand: true,
        orangeMoneyNumero: true,
        orangeMoneyNomAffichage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, boutique: user });
  } catch (error) {
    console.error('Erreur GET boutique/moi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// === PATCH ===
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const existing = await db.user.findUnique({
      where: { id: userId },
      select: { boutiqueSlug: true, boutiqueNom: true, nom: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (typeof body.boutiqueActive === 'boolean') {
      updates.boutiqueActive = body.boutiqueActive;
    }
    if (typeof body.boutiqueNom === 'string') {
      updates.boutiqueNom = body.boutiqueNom.trim().slice(0, 100) || null;
    }
    if (typeof body.boutiqueDescription === 'string') {
      updates.boutiqueDescription = body.boutiqueDescription.trim().slice(0, 500) || null;
    }
    if (typeof body.boutiqueWhatsApp === 'string') {
      const cleanWa = body.boutiqueWhatsApp.replace(/[^\d+]/g, '').slice(0, 20);
      updates.boutiqueWhatsApp = cleanWa || null;
    }
    if (typeof body.boutiqueLogoUrl === 'string') {
      if (body.boutiqueLogoUrl === '' || body.boutiqueLogoUrl === null) {
        updates.boutiqueLogoUrl = null;
      } else if (/^https?:\/\//.test(body.boutiqueLogoUrl)) {
        updates.boutiqueLogoUrl = body.boutiqueLogoUrl.slice(0, 500);
      }
    }
    if (typeof body.boutiqueAccentColor === 'string') {
      const color = body.boutiqueAccentColor.toLowerCase();
      if (/^#[0-9a-f]{6}$/.test(color)) {
        updates.boutiqueAccentColor = color;
      } else {
        return NextResponse.json({ error: 'Couleur invalide (format hex requis, ex: #2563eb)' }, { status: 400 });
      }
    }

    // Auto-générer le slug si pas encore fait
    const finalNom = (updates.boutiqueNom as string | null) || existing.boutiqueNom || existing.nom;
    if (finalNom && !existing.boutiqueSlug) {
      const baseSlug = finalNom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      if (baseSlug) {
        let slug = baseSlug;
        let suffix = 1;
        while (await db.user.findUnique({ where: { boutiqueSlug: slug } })) {
          slug = `${baseSlug}-${suffix}`;
          suffix++;
          if (suffix > 100) break;
        }
        updates.boutiqueSlug = slug;
      }
    }

    // Orange Money
    if (body.orangeMoneyType === 'MARCHAND' || body.orangeMoneyType === 'PARTICULIER') {
      updates.orangeMoneyType = body.orangeMoneyType;
      if (body.orangeMoneyType === 'MARCHAND') {
        if (typeof body.orangeMoneyCodeMarchand === 'string') {
          const code = body.orangeMoneyCodeMarchand.trim();
          if (code && !/^\d{6}$/.test(code)) {
            return NextResponse.json({ error: 'Code marchand invalide : 6 chiffres requis' }, { status: 400 });
          }
          updates.orangeMoneyCodeMarchand = code || null;
        }
        updates.orangeMoneyNumero = null;
      } else {
        if (typeof body.orangeMoneyNumero === 'string') {
          updates.orangeMoneyNumero = body.orangeMoneyNumero.replace(/[^\d+]/g, '').slice(0, 20) || null;
        }
        updates.orangeMoneyCodeMarchand = null;
      }
    }
    if (typeof body.orangeMoneyNomAffichage === 'string') {
      updates.orangeMoneyNomAffichage = body.orangeMoneyNomAffichage.trim().slice(0, 100) || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune modification valide reçue' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true, nom: true, email: true, boutiqueNom: true, boutiqueSlug: true,
        boutiqueDescription: true, boutiqueLogoUrl: true, boutiqueWhatsApp: true,
        boutiqueActive: true, boutiqueAccentColor: true, orangeMoneyType: true,
        orangeMoneyCodeMarchand: true, orangeMoneyNumero: true, orangeMoneyNomAffichage: true,
      },
    });

    return NextResponse.json({ success: true, boutique: updated });
  } catch (error) {
    console.error('Erreur PATCH boutique/moi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
