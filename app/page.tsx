import { getArticles } from "@/lib/actions";
import { fcfa } from "@/lib/format";
import Link from "next/link";
import { Plus } from "lucide-react";
import StockClient from "./stock-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await getArticles();

  const nbReference = articles.reduce((s, a) => s + a.quantite, 0);
  const valeurStock = articles.reduce((s, a) => s + a.valeurStock, 0);
  const venduTotal = articles.reduce((s, a) => s + a.vendu, 0);
  const caTotal = articles.reduce((s, a) => s + a.ca, 0);

  return (
    <div className="max-w-lg mx-auto px-4 pb-32">
      {/* En-tête */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-soft font-medium">Ma Boutique</p>
            <h1 className="text-2xl font-bold text-ink">Mon stock</h1>
          </div>
          <Link
            href="/article/nouveau"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold active:scale-95 transition"
          >
            <Plus size={16} strokeWidth={2.5} />
            Article
          </Link>
        </div>

        {/* Résumé économique */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-card rounded-2xl p-3 border border-line">
            <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">Valeur stock</p>
            <p className="text-base font-bold text-brand-dark leading-tight">{fcfa(valeurStock)}</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-line">
            <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">En stock</p>
            <p className="text-base font-bold text-ink leading-tight">{nbReference}</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-line">
            <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">CA ventes</p>
            <p className="text-base font-bold text-gold-dark leading-tight">{fcfa(caTotal)}</p>
          </div>
        </div>
      </header>

      <StockClient articles={articles} />
    </div>
  );
}