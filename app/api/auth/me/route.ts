import { NextResponse } from 'next/server';
import { getUtilisateur } from '@/lib/actions';

export async function GET() {
  try {
    const user = await getUtilisateur();
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return NextResponse.json(
      { user: null },
      { status: 500 }
    );
  }
}