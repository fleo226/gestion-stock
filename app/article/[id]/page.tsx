import { getArticle } from "@/lib/actions";
import { fcfa, dateHeure } from "@/lib/format";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Package, Pencil, History } from "lucide-react";
import Link from "next/link";
import MouvementClient from "./mouvement-client";
import SupprimerBouton from "./client-actions";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const entrees = article.mouvements?.filter((m) => m.type === "ENTREE") ?? [];
  const sorties = article.mouvements?.filter((m) => m.type === "SORTIE") ?? [];

  return (
    <div className="max-w-lg mx-auto px-4 pb-32">
      {/* Barre supérieure */}
      <div className="pt-5 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Retour
        </Link>
        <div className="flex gap-1 items-center">
          <Link
            href={`/article/${id}/modifier`}
            className="p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-black/5"
            aria-label="Modifier l'article"
          >
            <Pencil size={18} />
          </Link>
          <SupprimerBouton id={id} />
        </div>
      </div>

      {/* Photo + titre */}
      <div className="mt-3 bg-card rounded-3xl overflow-hidden border border-line">
        {article.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.photoUrl} alt={article.nom} className="w-full aspect-[4/3] object-cover" />
        ) : (
          <div className="w-full aspect-[4/3] bg-brand-soft/40 flex items-center justify-center text-brand">
            <Package size={64} strokeWidth={1.2} />
          </div>
        )}
        <div className="p-4">
          <h1 className="text-2xl font-bold text-ink">{article.nom}</h1>
          {(article.taille || article.couleur) && (
            <p className="text-sm text-ink-soft mt-0.5">
              {[article.taille, article.couleur].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-dark">{article.quantite}</span>
            <span className="text-ink-soft">{article.unite}s</span>
          </div>
          <p className="text-sm text-ink-soft">
            Vendu : <span className="font-semibold text-ink">{article.vendu}</span> · Entré :{" "}
            <span className="font-semibold text-ink">{article.entreeTotal}</span>
          </p>
        </div>
      </div>

      {/* Boutons entrée / sortie */}
      <MouvementClient article={article} />

      {/* Prix */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-card rounded-2xl p-3 border border-line">
          <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">Achat (unité)</p>
          <p className="text-lg font-bold text-ink">{fcfa(article.prixAchat)}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-line">
          <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">Vente (unité)</p>
          <p className="text-lg font-bold text-gold-dark">{fcfa(article.prixVente)}</p>
        </div>
      </div>

      {/* L'argent */}
      <div className="mt-2 bg-brand text-white rounded-2xl p-4">
        <h2 className="text-sm font-medium text-white/80">Ce que ça rapporte</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[11px] text-white/60 uppercase tracking-wide">Valeur stock</p>
            <p className="font-bold text-white leading-tight text-sm">{fcfa(article.valeurStock)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 uppercase tracking-wide">CA ventes</p>
            <p className="font-bold text-white leading-tight text-sm">{fcfa(article.ca)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 uppercase tracking-wide">Bénéfice</p>
            <p className="font-bold text-white leading-tight text-sm">{fcfa(article.benefice)}</p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="mt-6">
        <h2 className="flex items-center gap-2 font-semibold text-ink mb-3">
          <History size={18} className="text-brand" /> Historique
        </h2>
        {article.mouvements && article.mouvements.length > 0 ? (
          <ul className="space-y-2">
            {article.mouvements.map((m) => (
              <li key={m.id} className="flex items-center gap-3 bg-card rounded-xl px-3.5 py-2.5 border border-line">
                {m.type === "ENTREE" ? (
                  <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <ArrowDownToLine size={16} />
                  </span>
                ) : (
                  <span className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <ArrowUpFromLine size={16} />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm">
                    {m.type === "ENTREE" ? "Entrée" : "Vente"} · {m.quantite} {article.unite}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {m.note ? `${m.note} · ` : ""}
                    {dateHeure(m.date)}
                  </p>
                </div>
                <span
                  className={
                    m.type === "ENTREE"
                      ? "text-sm font-semibold text-brand-dark"
                      : "text-sm font-semibold text-danger"
                  }
                >
                  {m.type === "ENTREE" ? "+" : "−"}
                  {m.quantite}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft bg-card border border-line rounded-xl px-4 py-3">
            Aucun mouvement pour l'instant.
          </p>
        )}
      </div>
    </div>
  );
}