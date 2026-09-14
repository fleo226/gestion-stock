import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question requise' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Récupérer les données de la boutique
    const articles = await db.article.findMany({
      where: { userId },
      include: { mouvements: true },
    });

    // Calculer les stats pour l'IA
    let valeurStock = 0, benefice = 0, ca = 0, totalVendu = 0;
    const articlesContext = articles.map(a => {
      const sorties = a.mouvements.filter(m => m.type === 'SORTIE');
      const vendu = sorties.reduce((s, m) => s + m.quantite, 0);
      const valeur = a.quantite * a.prixAchat;
      const benef = vendu * (a.prixVente - a.prixAchat);
      const caArticle = vendu * a.prixVente;
      const entreeTotal = a.mouvements.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.quantite, 0);

      valeurStock += valeur;
      benefice += benef;
      ca += caArticle;
      totalVendu += vendu;

      return {
        nom: a.nom,
        taille: a.taille || undefined,
        couleur: a.couleur || undefined,
        prixAchat: a.prixAchat,
        prixVente: a.prixVente,
        quantite: a.quantite,
        unite: a.unite,
        entreeTotal,
        vendu,
        benefice: benef,
        ca: caArticle,
        valeurStock: valeur,
      };
    });

    const stats = {
      totalArticles: articles.length,
      valeurStock,
      benefice,
      ca,
      totalVendu,
    };

    // Appel GLM 4.5 Flash
    const { callGLM, buildContextPrompt } = await import('@/lib/ai-assistant');
    const messages = buildContextPrompt(
      { articles: articlesContext, stats, userName: user.nom },
      question.trim()
    );

    const reponse = await callGLM(messages, {
      temperature: 0.7,
      maxTokens: 800,
    });

    return NextResponse.json({
      success: true,
      reponse,
      context: { stats },
    });

  } catch (error: any) {
    console.error('Erreur assistant IA:', error);

    if (error.message?.includes('GLM_API_KEY')) {
      return NextResponse.json(
        { error: 'Assistant IA non configuré - clé API manquante' },
        { status: 503 }
      );
    }

    if (error.message?.includes('GLM API error')) {
      return NextResponse.json(
        { error: 'Erreur du service IA - veuillez réessayer' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    );
  }
}