import Link from "next/link";
import ArticleForm from "../../article-form";

export default function NouvelArticlePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-ink">Nouvel article</h1>
        <span className="w-10" />
      </div>
      <ArticleForm />
    </div>
  );
}