import { NextRequest, NextResponse } from 'next/server';
import { creerCompte } from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nom } = await request.json();

    if (!email || !password || !nom) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    // Validation email basique
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Le mot de passe doit faire au moins 4 caractères' },
        { status: 400 }
      );
    }

    const result = await creerCompte(email.trim().toLowerCase(), password, nom.trim());

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}