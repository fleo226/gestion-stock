import { NextResponse } from 'next/server';
import { deconnecter } from '@/lib/actions';

export async function POST() {
  try {
    const result = await deconnecter();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}