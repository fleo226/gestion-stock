import { NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL } from './env';

// Type pour les messages de conversation
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Configuration NVIDIA
const NVIDIA_CONFIG = {
  apiKey: NVIDIA_API_KEY,
  baseUrl: NVIDIA_BASE_URL,
  model: NVIDIA_MODEL,
} as const;

// Validation de la configuration
if (!NVIDIA_CONFIG.apiKey || !NVIDIA_CONFIG.baseUrl || !NVIDIA_CONFIG.model) {
  console.warn('NVIDIA configuration incomplete - AI features will be disabled');
}

/**
 * Appel à l'API NVIDIA Nemotron 3.5 Lightning
 */
export async function callNVIDIA(messages: ChatMessage[], options?: {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}): Promise<string> {
  if (!NVIDIA_CONFIG.apiKey) {
    throw new Error('NVIDIA_API_KEY non configurée');
  }

  const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_CONFIG.model,
      messages,
      temperature: options?.temperature ?? 1.0,
      max_tokens: options?.maxTokens ?? 1000,
      stream: options?.stream ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Assistant IA pour Ma Boutique - Contexte métier
 */
export const BOUTIQUE_SYSTEM_PROMPT = `Tu es l'assistant IA de "Ma Boutique", une application de gestion de stock pour commerçantes au Burkina Faso.

CONTEXTE UTILISATRICE :
- Commerçante (vêtements, pagnes, accessoires)
- Gère son stock : entrées, sorties, prix achat/vente
- Veut voir ses bénéfices, marges, chiffre d'affaires
- Parle français, utilise FCFA
- Peut avoir peu de connaissances comptables

TES RÔLES :
1. **Conseil stock** : quels articles réapprovisionner, quels articles ne bougent pas
2. **Prix & Marge** : suggérer prix de vente selon marge cible + concurrence locale
3. **Analyse ventes** : tendances, saisonnalité, meilleures ventes
4. **Gestion courante** : expliquer les calculs (bénéfice, marge, rotation)
5. **Marketing local** : idées WhatsApp/Instagram, descriptions produits

STYLE :
- Ton professionnel mais chaleureux ("Madame", "vous")
- Explications simples, sans jargon comptable
- Exemples concrets en FCFA
- Réponses actionnables (actions précises à faire)
- Max 3-4 paragraphes courts

NE FAIS PAS :
- Inventer des données (dis "je n'ai pas accès à...")
- Conseils juridiques/fiscaux
- Promesses de gains`;

export interface AssistantContext {
  articles?: Array<{
    nom: string;
    taille?: string;
    couleur?: string;
    prixAchat: number;
    prixVente: number;
    quantite: number;
    unite: string;
    entreeTotal: number;
    vendu: number;
    benefice: number;
    ca: number;
    valeurStock: number;
  }>;
  stats?: {
    totalArticles: number;
    valeurStock: number;
    benefice: number;
    ca: number;
    totalVendu: number;
  };
  userName?: string;
}

/**
 * Génère le prompt enrichi avec le contexte de la boutique
 */
export function buildContextPrompt(context: AssistantContext, question: string): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: BOUTIQUE_SYSTEM_PROMPT },
  ];

  // Ajouter le contexte si disponible
  if (context.articles?.length || context.stats) {
    let contextContent = `CONTEXTE BOUTIQUE DE ${context.userName || 'la commerçante'} :\n\n`;

    if (context.stats) {
      contextContent += `STATS GLOBALES :
- ${context.stats.totalArticles} articles en stock
- Valeur stock : ${context.stats.valeurStock.toLocaleString()} FCFA
- Bénéfice total : ${context.stats.benefice.toLocaleString()} FCFA
- Chiffre d'affaires : ${context.stats.ca.toLocaleString()} FCFA
- Total vendu : ${context.stats.totalVendu} unités\n\n`;
    }

    if (context.articles?.length) {
      contextContent += `DÉTAIL ARTICLES (${context.articles.length}) :\n`;
      context.articles.forEach((a, i) => {
        const marge = a.prixAchat > 0 ? Math.round(((a.prixVente - a.prixAchat) / a.prixAchat) * 100) : 0;
        const rotation = a.entreeTotal > 0 ? Math.round((a.vendu / a.entreeTotal) * 100) : 0;
        contextContent += `${i + 1}. ${a.nom}${a.taille ? ` (${a.taille})` : ''}${a.couleur ? ` - ${a.couleur}` : ''}
   Achat: ${a.prixAchat.toLocaleString()} | Vente: ${a.prixVente.toLocaleString()} | Marge: ${marge}%
   Stock: ${a.quantite} ${a.unite} | Vendus: ${a.vendu} | Rotation: ${rotation}%
   Bénéfice: ${a.benefice.toLocaleString()} FCFA | CA: ${a.ca.toLocaleString()} FCFA
   Valeur stock: ${a.valeurStock.toLocaleString()} FCFA\n`;
      });
    }

    messages.push({ role: 'system', content: contextContent });
  }

  messages.push({ role: 'user', content: question });
  return messages;
}

/**
 * Questions suggérées selon le contexte
 */
export function getSuggestedQuestions(context: AssistantContext): string[] {
  const base = [
    "Quels articles dois-je réapprovisionner cette semaine ?",
    "Comment améliorer ma marge globale ?",
    "Quels sont mes meilleures ventes du mois ?",
  ];

  if (context.articles?.length) {
    const ruptures = context.articles.filter(a => a.quantite === 0);
    const faibles = context.articles.filter(a => a.quantite > 0 && a.quantite <= 3);
    const invendus = context.articles.filter(a => a.vendu === 0 && a.entreeTotal > 5);

    if (ruptures.length) base.unshift(`${ruptures.length} article(s) en rupture - que faire ?`);
    if (faibles.length) base.unshift(`${faibles.length} article(s) stock faible - réapprovisionner ?`);
    if (invendus.length) base.push(`${invendus.length} article(s) ne se vendent pas - idées pour écouler ?`);
  }

  return base.slice(0, 5);
}