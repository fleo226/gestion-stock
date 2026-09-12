"use client";

import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import Link from "next/link";
import { fcfa } from "@/lib/format";
import type { ArticleAvecVentes } from "@/lib/actions";

export default function StockClient({ articles }: { articles: ArticleAvecVentes[] }) {
  const [q, setQ] = useState("");

  const filtres = useMemo(() => {
    if (!q.trim()) return articles;
    const s = q.trim().toLowerCase();
    return articles.filter((a) =>
      [a.nom, a.taille, a.couleur, a.unite]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(s))
    );
  }, [q, articles]);

  return (
    <div>
      <div className="mb-4 relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un article..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-line text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
        />
      </div>

      {filtres.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-soft/60 text-brand flex items-center justify-center">
            <Package size={30} />
          </div>
          <p className="mt-4 font-medium text-ink">
            {q ? "Aucun article trouvé" : "Votre stock est vide"}
          </p>
          <p className="text-sm text-ink-soft mt-1">
            {q ? "Essayez un autre nom." : "Ajoutez votre premier article pour commencer."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtres.map((a) => (
            <li key={a.id}>
              <Link
                href={`/article/${a.id}`}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-line active:scale-[0.99] transition"
              >
                {/* Photo */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-soft/50 shrink-0 flex items-center justify-center">
                  {a.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.photoUrl} alt={a.nom} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={22} className="text-brand/60" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{a.nom}</p>
                  <p className="text-xs text-ink-soft truncate">
                    {a.vendu > 0 ? `Vendu : ${a.vendu}` : "Pas encore de vente"}
                    {a.taille ? ` · ${a.taille}` : ""}
                    {a.couleur ? ` · ${a.couleur}` : ""}
                  </p>
                </div>

                {/* Reste + prix */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-brand-dark leading-tight">
                    {a.quantite} <span className="text-xs font-medium text-ink-soft">{a.unite}</span>
                  </p>
                  <p className="text-xs text-ink-soft">{fcfa(a.prixVente)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}