import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUtilisateur } from '@/lib/actions';

// GET — Récupère une conversation avec ses messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUtilisateur();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { creeLe: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('Erreur lecture conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — Supprime une conversation (atomique, sans race condition)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUtilisateur();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db.conversation.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}