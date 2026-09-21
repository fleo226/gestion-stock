import { NextResponse } from 'next/server';
import { deconnecter } from '@/lib/actions';

export async function POST() {
  try {
    await deconnecter();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
