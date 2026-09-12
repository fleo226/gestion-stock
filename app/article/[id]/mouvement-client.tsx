"use client";

import { useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Ban } from "lucide-react";
import { entreeArticle, sortieArticle, type ArticleAvecVentes } from "@/lib/actions";

export default function MouvementClient({
  article,
}: {
  article: ArticleAvecVentes;
}) {
  const [mode, setMode] = useState<"entree" | "sortie" | null>(null);
  const [qte, setQte] = useState("1");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function valider() {
    const n = parseInt(qte, 10);
    if (!n || n < 1) {
      setErreur("Entrez une quantité d'au moins 1");
      return;
    }
    setErreur(null);
    startTransition(async () => {
      const res =
        mode === "entree"
          ? await entreeArticle(article.id, n, note)
          : await sortieArticle(article.id, n, note);
      if (res && "erreur" in res && res.erreur) {
        setErreur(res.erreur);
      } else {
        setMode(null);
        setNote("");
        setQte("1");
      }
    });
  }

  if (mode === null) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => { setMode("entree"); setErreur(null); }}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white font-semibold text-lg active:scale-[0.98] transition"
        >
          <ArrowDownToLine size={22} strokeWidth={2.5} /> Entrée
        </button>
        <button
          onClick={() => { setMode("sortie"); setErreur(null); }}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-danger text-white font-semibold text-lg active:scale-[0.98] transition"
        >
          <ArrowUpFromLine size={22} strokeWidth={2.5} /> Vente
        </button>
      </div>
    );
  }

  const estEntree = mode === "entree";

  return (
    <div className="anim-pop mt-4 bg-card rounded-2xl border border-line p-4">
      <p className="font-semibold text-ink mb-3">
        {estEntree ? "Nouvelle entrée" : "Nouvelle vente"}
      </p>

      <div className="flex items-center gap-3">
        <input
          autoFocus
          inputMode="numeric"
          value={qte}
          onChange={(e) => setQte(e.target.value)}
          className="w-24 px-4 py-3 rounded-xl border border-line bg-white text-ink text-lg font-bold text-center focus:outline-none focus:border-brand"
          aria-label="Quantité"
        />
        <div className="flex-1">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={estEntree ? "Note (ex. fournisseur Bamako)" : "Note (ex. client Aminata)"}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-white text-ink text-sm placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Quick add */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {["1", "2", "3", "5", "10"].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setQte(n)}
            className="px-3.5 py-1.5 rounded-lg bg-brand-soft text-brand text-sm font-semibold active:scale-95 transition"
          >
            {n}
          </button>
        ))}
      </div>

      {erreur && (
        <p className="mt-3 text-sm font-medium text-danger flex items-center gap-1.5">
          <Ban size={15} /> {erreur}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => { setMode(null); setErreur(null); }}
          disabled={pending}
          className="py-3.5 rounded-xl border border-line text-ink-soft font-medium active:scale-[0.98] disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          disabled={pending}
          className={`py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 transition ${
            estEntree ? "bg-brand" : "bg-danger"
          }`}
        >
          {pending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : estEntree ? (
            <ArrowDownToLine size={18} />
          ) : (
            <ArrowUpFromLine size={18} />
          )}
          {estEntree ? "Ajouter" : "Vendre"}
        </button>
      </div>
    </div>
  );
}