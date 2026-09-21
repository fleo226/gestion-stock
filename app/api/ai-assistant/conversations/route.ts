import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUtilisateur } from '@/lib/actions';

// GET — Liste toutes les conversations de l'utilisateur
export async function GET() {
  try {
    const user = await getUtilisateur();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { majLe: 'desc' },
      select: {
        id: true,
        titre: true,
        creeLe: true,
        majLe: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Erreur liste conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — Crée une nouvelle conversation
export async function POST(request: NextRequest) {
  try {
    const user = await getUtilisateur();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const titre = typeof body.titre === 'string' && body.titre.trim()
      ? body.titre.trim().slice(0, 100)
      : 'Nouvelle discussion';

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        titre,
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}