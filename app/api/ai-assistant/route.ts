import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { question, conversationId: existingConversationId } = await request.json().catch(() => ({}));
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

    // Récupérer les données de la boutique (limité pour performance)
    const articles = await db.article.findMany({
      where: { userId },
      include: {
        mouvements: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
      take: 20,
      orderBy: { creeLe: 'desc' },
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

    // === Construction des messages (1 SEULE FOIS) ===
    const { callGLMStream, buildContextPrompt } = await import('@/lib/ai-assistant');
    const messages = buildContextPrompt(
      { articles: articlesContext, stats, userName: user.nom },
      question.trim()
    );

    // === CRÉER LA CONVERSATION AVANT LE STREAM ===
    let conversationId = existingConversationId;
    if (conversationId) {
      const conv = await db.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });
      if (!conv) conversationId = undefined;
    }
    if (!conversationId) {
      const titre = question.trim().slice(0, 60) + (question.length > 60 ? '...' : '');
      const conv = await db.conversation.create({
        data: { userId: user.id, titre },
      });
      conversationId = conv.id;
    } else {
      await db.conversation.update({
        where: { id: conversationId },
        data: { majLe: new Date() },
      });
    }

    // === SAUVEGARDER LE MESSAGE USER AVANT LE STREAM ===
    await db.message.create({
      data: { conversationId, role: 'user', contenu: question.trim() },
    });

    // === LANCER LE STREAM SSE ===
    const encoder = new TextEncoder();
    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (data: string): boolean => {
          try {
            controller.enqueue(encoder.encode(data));
            return true;
          } catch {
            abortController.abort();
            return false;
          }
        };

        // 1. Meta event
        if (!safeEnqueue(`event: meta\ndata: ${JSON.stringify({ conversationId, stats })}\n\n`)) return;

        let fullResponse = '';
        try {
          // ✅ FIX : on utilise la variable `messages` déjà construite plus haut
          // (au lieu de la reconstruire via un 2e import dynamique)
          for await (const chunk of callGLMStream(messages, {
            temperature: 0.7,
            maxTokens: 800,
            signal: abortController.signal,
          })) {
            fullResponse += chunk;
            if (!safeEnqueue(`event: token\ndata: ${JSON.stringify({ content: chunk })}\n\n`)) return;
          }

          // Sauvegarder la réponse complète
          await db.message.create({
            data: { conversationId, role: 'assistant', contenu: fullResponse },
          }).catch(e => console.error('Save réponse échouée:', e));

          safeEnqueue(`event: done\ndata: {}\n\n`);
        } catch (e: any) {
          if (fullResponse) {
            await db.message.create({
              data: { conversationId, role: 'assistant', contenu: fullResponse + ' [interrompu]' },
            }).catch(err => console.error('Save partielle échouée:', err));
          }
          safeEnqueue(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
        } finally {
          try { controller.close(); } catch {}
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'identity',
      },
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
