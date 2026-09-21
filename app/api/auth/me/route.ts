import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user) {
      return NextResponse.json({ 
        user: {
          id: session.user.id,
          email: session.user.email,
          nom: session.user.nom,
          couleur: session.user.couleur,
        }
      });
    }
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return NextResponse.json(
      { user: null },
      { status: 500 }
    );
  }
}