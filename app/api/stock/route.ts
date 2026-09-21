import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getArticles, 
  creerArticle, 
  modifierArticle, 
  supprimerArticle,
  entreeArticle,
  sortieArticle,
  getArticle,
  getStatistiques,
  getUtilisateur
} from '@/lib/actions';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'stats') {
      const stats = await getStatistiques();
      return NextResponse.json({ success: true, data: stats });
    }

    if (id) {
      const article = await getArticle(id);
      if (!article) {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: article });
    }

    const articles = await getArticles();
    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    console.error('Erreur GET stock:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'create': {
        const result = await creerArticle(data);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'update': {
        const { id, ...input } = data;
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        const result = await modifierArticle(id, input);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'delete': {
        const { id } = data;
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        const result = await supprimerArticle(id);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'entree': {
        const { articleId, quantite, prixUnitaire, note } = data;
        if (!articleId || !quantite) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        const result = await entreeArticle(articleId, quantite, prixUnitaire, note);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'sortie': {
        const { articleId, quantite, prixUnitaire, note } = data;
        if (!articleId || !quantite) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        const result = await sortieArticle(articleId, quantite, prixUnitaire, note);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      case 'update-profile': {
        const { nom, couleur } = data;
        const user = await getUtilisateur();
        if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

        await db.user.update({
          where: { id: user.id },
          data: { nom: nom.trim(), couleur: couleur || '#2563eb' },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur POST stock:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}