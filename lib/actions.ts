"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ============== TYPES ==============

export type MouvementData = {
  id: string;
  type: string;
  quantite: number;
  prixUnitaire: number;
  date: Date;
  note: string | null;
};

export type ArticleAvecVentes = {
  id: string;
  nom: string;
  taille: string | null;
  couleur: string | null;
  prixAchat: number;
  prixVente: number;
  quantite: number;
  unite: string;
  photoUrl: string | null;
  creeLe: Date;
  mouvements?: MouvementData[];
  entreeTotal: number;
  vendu: number;
  valeurStock: number;
  benefice: number;
  ca: number;
};

export type CreerArticleInput = {
  nom: string;
  taille?: string | null;
  couleur?: string | null;
  prixAchat: number;
  prixVente: number;
  quantite: number;
  unite: string;
  photoUrl?: string | null;
  categorieId?: string | null;
};

// ============== HELPERS ==============

function enrichir(article: any): ArticleAvecVentes {
  const entrees = article.mouvements?.filter((m: any) => m.type === "ENTREE") ?? [];
  const sorties = article.mouvements?.filter((m: any) => m.type === "SORTIE") ?? [];
  const entreeTotal = entrees.reduce((s: number, m: any) => s + m.quantite, 0);
  const vendu = sorties.reduce((s: number, m: any) => s + m.quantite, 0);
  return {
    ...article,
    entreeTotal,
    vendu,
    valeurStock: article.quantite * article.prixAchat,
    benefice: vendu * (article.prixVente - article.prixAchat),
    ca: vendu * article.prixVente,
  };
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  return userId ?? null;
}

// ============== AUTH ==============

export async function creerCompte(email: string, password: string, nom: string) {
  const bcrypt = await import("bcryptjs");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Cet email est déjà utilisé" };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { email, passwordHash, nom: nom.trim() },
  });
  const cookieStore = await cookies();
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
  return { success: true, user: { id: user.id, email: user.email, nom: user.nom, couleur: user.couleur } };
}

export async function connecter(email: string, password: string) {
  const bcrypt = await import("bcryptjs");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Email ou mot de passe incorrect" };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Email ou mot de passe incorrect" };
  const cookieStore = await cookies();
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { success: true, user: { id: user.id, email: user.email, nom: user.nom, couleur: user.couleur } };
}

export async function deconnecter() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  return { success: true };
}

export async function getUtilisateur() {
  const userId = await getUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  return user ? { id: user.id, email: user.email, nom: user.nom, couleur: user.couleur } : null;
}

// ============== ARTICLES ==============

export async function getArticles(): Promise<ArticleAvecVentes[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const articles = await db.article.findMany({
    where: { userId },
    include: { mouvements: true },
    orderBy: { creeLe: "desc" },
  });
  return articles.map(enrichir);
}

export async function getArticle(id: string): Promise<ArticleAvecVentes | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const article = await db.article.findFirst({
    where: { id, userId },
    include: { mouvements: { orderBy: { date: "desc" } } },
  });
  return article ? enrichir(article) : null;
}

export async function creerArticle(input: CreerArticleInput) {
  const userId = await getUserId();
  if (!userId) return { error: "Non connecté" };
  if (!input.nom.trim()) return { error: "Le nom est obligatoire" };

  const quantite = Math.max(0, Math.round(input.quantite || 0));
  const article = await db.article.create({
    data: {
      userId,
      categorieId: input.categorieId || null,
      nom: input.nom.trim(),
      taille: input.taille?.trim() || null,
      couleur: input.couleur?.trim() || null,
      prixAchat: Math.round(input.prixAchat || 0),
      prixVente: Math.round(input.prixVente || 0),
      quantite,
      unite: input.unite || "pièce",
      photoUrl: input.photoUrl || null,
    },
  });

  // Créer le mouvement d'entrée initiale si quantité > 0
  if (quantite > 0) {
    await db.mouvement.create({
      data: {
        articleId: article.id,
        type: "ENTREE",
        quantite,
        prixUnitaire: Math.round(input.prixAchat || 0),
        note: "Stock initial",
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/stock");
  return { success: true, id: article.id };
}

export async function modifierArticle(id: string, input: CreerArticleInput) {
  const userId = await getUserId();
  if (!userId) return { error: "Non connecté" };

  const article = await db.article.findFirst({ where: { id, userId } });
  if (!article) return { error: "Article introuvable" };

  await db.article.update({
    where: { id },
    data: {
      nom: input.nom.trim(),
      taille: input.taille?.trim() || null,
      couleur: input.couleur?.trim() || null,
      prixAchat: Math.round(input.prixAchat || 0),
      prixVente: Math.round(input.prixVente || 0),
      unite: input.unite || "pièce",
      photoUrl: input.photoUrl || null,
      categorieId: input.categorieId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/stock");
  return { success: true };
}

export async function supprimerArticle(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Non connecté" };

  const article = await db.article.findFirst({ where: { id, userId } });
  if (!article) return { error: "Article introuvable" };

  await db.article.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/stock");
  return { success: true };
}

// ============== MOUVEMENTS ==============

export async function entreeArticle(articleId: string, quantite: number, prixUnitaire: number, note?: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Non connecté" };

  const article = await db.article.findFirst({ where: { id: articleId, userId } });
  if (!article) return { error: "Article introuvable" };

  const qte = Math.max(1, Math.round(quantite));

  await db.mouvement.create({
    data: {
      articleId,
      type: "ENTREE",
      quantite: qte,
      prixUnitaire: Math.round(prixUnitaire),
      note: note?.trim() || null,
    },
  });

  await db.article.update({
    where: { id: articleId },
    data: { quantite: article.quantite + qte },
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath(`/article/${articleId}`);
  return { success: true };
}

export async function sortieArticle(articleId: string, quantite: number, prixUnitaire: number, note?: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Non connecté" };

  const article = await db.article.findFirst({ where: { id: articleId, userId } });
  if (!article) return { error: "Article introuvable" };

  const qte = Math.max(1, Math.round(quantite));
  if (qte > article.quantite) {
    return { error: `Stock insuffisant. Disponible : ${article.quantite}` };
  }

  await db.mouvement.create({
    data: {
      articleId,
      type: "SORTIE",
      quantite: qte,
      prixUnitaire: Math.round(prixUnitaire),
      note: note?.trim() || null,
    },
  });

  await db.article.update({
    where: { id: articleId },
    data: { quantite: article.quantite - qte },
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath(`/article/${articleId}`);
  return { success: true };
}

// ============== STATISTIQUES ==============

export async function getStatistiques() {
  const userId = await getUserId();
  if (!userId) return { totalArticles: 0, valeurStock: 0, benefice: 0, ca: 0, totalVendu: 0 };

  const articles = await db.article.findMany({
    where: { userId },
    include: { mouvements: true },
  });

  let valeurStock = 0;
  let benefice = 0;
  let ca = 0;
  let totalVendu = 0;

  for (const article of articles) {
    const sorties = article.mouvements.filter((m) => m.type === "SORTIE");
    const vendu = sorties.reduce((s, m) => s + m.quantite, 0);
    valeurStock += article.quantite * article.prixAchat;
    benefice += vendu * (article.prixVente - article.prixAchat);
    ca += vendu * article.prixVente;
    totalVendu += vendu;
  }

  return {
    totalArticles: articles.length,
    valeurStock,
    benefice,
    ca,
    totalVendu,
  };
}

// ============== CATÉGORIES ==============

export type CategorieData = {
  id: string;
  nom: string;
  couleur: string;
  ordre: number;
  creeLe: Date;
  articleCount?: number;
};

export async function getCategories(): Promise<CategorieData[]> {
  const userId = await getUserId();
  if (!userId) return [];
  
  const categories = await db.categorie.findMany({
    where: { userId },
    include: { articles: true },
    orderBy: { ordre: 'asc' },
  });

  return categories.map(c => ({
    id: c.id,
    nom: c.nom,
    couleur: c.couleur,
    ordre: c.ordre,
    creeLe: c.creeLe,
    articleCount: c.articles.length,
  }));
}

export async function creerCategorie(nom: string, couleur?: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Non connecté' };
  if (!nom.trim()) return { error: 'Le nom est obligatoire' };

  const maxOrdre = await db.categorie.findFirst({
    where: { userId },
    orderBy: { ordre: 'desc' },
    select: { ordre: true },
  });

  const categorie = await db.categorie.create({
    data: {
      userId,
      nom: nom.trim(),
      couleur: couleur || '#2563eb',
      ordre: (maxOrdre?.ordre || 0) + 1,
    },
  });

  revalidatePath('/stock');
  return { success: true, id: categorie.id };
}

export async function modifierCategorie(id: string, nom: string, couleur?: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Non connecté' };

  const categorie = await db.categorie.findFirst({ where: { id, userId } });
  if (!categorie) return { error: 'Catégorie introuvable' };

  await db.categorie.update({
    where: { id },
    data: {
      nom: nom.trim(),
      couleur: couleur || categorie.couleur,
    },
  });

  revalidatePath('/stock');
  return { success: true };
}

export async function supprimerCategorie(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Non connecté' };

  const categorie = await db.categorie.findFirst({ where: { id, userId } });
  if (!categorie) return { error: 'Catégorie introuvable' };

  await db.article.updateMany({
    where: { categorieId: id },
    data: { categorieId: null },
  });

  await db.categorie.delete({ where: { id } });

  revalidatePath('/stock');
  return { success: true };
}
