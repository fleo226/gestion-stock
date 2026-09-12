import { getArticle } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleForm from "../../../article-form";

export const dynamic = "force-dynamic";

export default async function ModifierArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <Link href={`/article/${id}`} className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-ink">Modifier l'article</h1>
        <span className="w-10" />
      </div>
      <ArticleForm
        articleId={article.id}
        article={{
          nom: article.nom,
          taille: article.taille,
          couleur: article.couleur,
          prixAchat: article.prixAchat,
          prixVente: article.prixVente,
          quantite: article.quantite,
          unite: article.unite,
          photoUrl: article.photoUrl,
        }}
      />
    </div>
  );
}