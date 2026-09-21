import { NextResponse } from 'next/server';
import { getUtilisateur } from '@/lib/actions';

export async function GET() {
  try {
    const user = await getUtilisateur();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return NextResponse.json(
      { user: null, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
