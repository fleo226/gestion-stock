import { NextRequest, NextResponse } from 'next/server';
import { 
  getCategories, 
  creerCategorie, 
  modifierCategorie, 
  supprimerCategorie 
} from '@/lib/actions';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Erreur GET categories:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create': {
        const result = await creerCategorie(data.nom, data.couleur);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'update': {
        const { id, nom, couleur } = data;
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        const result = await modifierCategorie(id, nom, couleur);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'delete': {
        const { id } = data;
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        const result = await supprimerCategorie(id);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Action non supportée' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur POST categories:', error);
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}