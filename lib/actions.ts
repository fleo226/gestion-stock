"use server";

import { db } from "./db";
import { supabaseAdmin } from "./supabase-admin";
import { revalidatePath } from "next/cache";

// ---------- Outils ----------

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
  // Calculés
  entreeTotal: number;
  vendu: number;
  valeurStock: number; // quantite * prixAchat
  benefice: number;    // vendu * (prixVente - prixAchat)
  ca: number;          // vendu * prixVente
};

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

// ---------- Articles ----------

export async function getArticles(): Promise<ArticleAvecVentes[]> {
  const articles = await db.article.findMany({
    include: { mouvements: true },
    orderBy: { creeLe: "desc" },
  });
  return articles.map(enrichir);
}

export async function getArticle(id: string): Promise<ArticleAvecVentes | null> {
  const article = await db.article.findUnique({
    where: { id },
    include: {
      mouvements: { orderBy: { date: "desc" } },
    },
  });
  return article ? enrichir(article) : null;
}

export type CreerArticleInput = {
  nom: string;
  taille?: string | null;
  couleur?: string | null;
  prixAchat: number;
  prixVente: number;
  quantite: number;
  unite: string;
  photoUrl?: string | null;
};

export async function creerArticle(input: CreerArticleInput) {
  const quantite = Math.max(1, Math.round(input.quantite || 1));
  const article = await db.article.create({
    data: {
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
  // La création initiale est une entrée
  await db.mouvement.create({
    data: {
      articleId: article.id,
      type: "ENTREE",
      quantite,
      prixUnitaire: article.prixAchat,
      note: "Création de l'article",
    },
  });
  revalidatePath("/");
  return article;
}

export async function modifierArticle(
  id: string,
  input: Omit<CreerArticleInput, "quantite">
) {
  const article = await db.article.update({
    where: { id },
    data: {
      nom: input.nom.trim(),
      taille: input.taille?.trim() || null,
      couleur: input.couleur?.trim() || null,
      prixAchat: Math.round(input.prixAchat || 0),
      prixVente: Math.round(input.prixVente || 0),
      unite: input.unite || "pièce",
      photoUrl: input.photoUrl || null,
    },
  });
  revalidatePath("/");
  revalidatePath(`/article/${id}`);
  return article;
}

export async function supprimerArticle(id: string) {
  const article = await db.article.findUnique({ where: { id } });
  // Supprime la photo du stockage si elle existe
  if (article?.photoUrl) {
    const chemin = article.photoUrl.split("/public/photos/")[1];
    if (chemin) {
      await supabaseAdmin.storage.from("photos").remove([chemin]).catch(() => {});
    }
  }
  await db.article.delete({ where: { id } });
  revalidatePath("/");
}

// ---------- Mouvements (entrées / sorties) ----------

export async function entreeArticle(id: string, quantite: number, note?: string) {
  if (quantite < 1) return { erreur: "La quantité doit être au moins 1" };
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { erreur: "Article introuvable" };
  await db.$transaction([
    db.article.update({
      where: { id },
      data: { quantite: { increment: Math.round(quantite) } },
    }),
    db.mouvement.create({
      data: {
        articleId: id,
        type: "ENTREE",
        quantite: Math.round(quantite),
        prixUnitaire: article.prixAchat,
        note: note?.trim() || null,
      },
    }),
  ]);
  revalidatePath("/");
  revalidatePath(`/article/${id}`);
  return { ok: true };
}

export async function sortieArticle(id: string, quantite: number, note?: string) {
  if (quantite < 1) return { erreur: "La quantité doit être au moins 1" };
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return { erreur: "Article introuvable" };
  if (quantite > article.quantite) {
    return {
      erreur: `Stock insuffisant : il reste ${article.quantite} ${article.unite}(s)`,
    };
  }
  await db.$transaction([
    db.article.update({
      where: { id },
      data: { quantite: { decrement: Math.round(quantite) } },
    }),
    db.mouvement.create({
      data: {
        articleId: id,
        type: "SORTIE",
        quantite: Math.round(quantite),
        prixUnitaire: article.prixVente,
        note: note?.trim() || null,
      },
    }),
  ]);
  revalidatePath("/");
  revalidatePath(`/article/${id}`);
  return { ok: true };
}

// ---------- Photo ----------

export async function televerserPhoto(formData: FormData): Promise<string | null> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return null;
  // Limite 8 Mo
  if (file.size > 8 * 1024 * 1024) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabaseAdmin.storage
    .from("photos")
    .upload(nom, file, { contentType: file.type, upsert: false });
  if (error) return null;
  const { data: urlData } = supabaseAdmin.storage.from("photos").getPublicUrl(data.path);
  return urlData.publicUrl;
}