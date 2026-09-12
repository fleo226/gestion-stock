"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { creerArticle, modifierArticle, televerserPhoto } from "@/lib/actions";

const UNITES = ["pièce", "paire", "mètre", "kg", "lot", "sachet"];

type ArticleFormProps = {
  onDone?: () => void;
  /** Mode modification : l'article existant (id + valeurs) */
  articleId?: string;
  article?: {
    nom: string;
    taille: string | null;
    couleur: string | null;
    prixAchat: number;
    prixVente: number;
    quantite: number;
    unite: string;
    photoUrl: string | null;
  } | null;
};

export default function ArticleForm({ onDone, articleId, article }: ArticleFormProps) {
  const [photo, setPhoto] = useState<string | null>(article?.photoUrl ?? null);
  const [apercu, setApercu] = useState<string | null>(article?.photoUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function gérerPhoto(fichier: File | undefined) {
    if (!fichier) return;
    if (fichier.size > 8 * 1024 * 1024) {
      setError("La photo est trop lourde (max 8 Mo)");
      return;
    }
    const fd = new FormData();
    fd.append("photo", fichier);
    const url = await televerserPhoto(fd);
    if (url) {
      setPhoto(url);
      setApercu(URL.createObjectURL(fichier));
      setError(null);
    } else {
      setError("Impossible d'enregistrer la photo, réessayez");
    }
  }

  function envoyer(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const nom = String(formData.get("nom") || "").trim();
      const prixAchat = Number(formData.get("prixAchat") || 0);
      const prixVente = Number(formData.get("prixVente") || 0);
      const quantite = Number(formData.get("quantite") || 1);
      if (!nom) return setError("Donnez un nom à l'article");
      if (prixAchat <= 0) return setError("Indiquez le prix d'achat");
      if (prixVente <= 0) return setError("Indiquez le prix de vente");

      const data = {
        nom,
        taille: String(formData.get("taille") || "") || null,
        couleur: String(formData.get("couleur") || "") || null,
        prixAchat,
        prixVente,
        unite: String(formData.get("unite") || "pièce"),
        photoUrl: photo,
      };

      const res = articleId
        ? await modifierArticle(articleId, data)
        : await creerArticle({ ...data, quantite: quantite || 1 });

      if (res) onDone?.();
    });
  }

  return (
    <div className="anim-pop">
      <div className="flex justify-center mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => gérerPhoto(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-[150px] h-[150px] rounded-2xl border-2 border-dashed border-brand-soft bg-brand-soft/40 flex flex-col items-center justify-center gap-1 text-brand overflow-hidden active:scale-95 transition"
        >
          {apercu ? (
            <>
              <img src={apercu} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute bottom-2 px-3 py-1 bg-black/55 text-white text-xs rounded-full flex items-center gap-1">
                <ImagePlus size={14} /> Changer
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={30} />
              <span className="text-sm font-medium">Photo de l'article</span>
              <span className="text-xs text-ink-soft">appareil ou galerie</span>
            </>
          )}
        </button>
      </div>

      {apercu && (
        <button
          type="button"
          onClick={() => { setPhoto(null); setApercu(null); }}
          className="mx-auto mb-3 flex items-center gap-1 text-sm text-danger bg-danger/10 px-3 py-1.5 rounded-full"
        >
          <X size={14} /> Ne pas garder cette photo
        </button>
      )}

      <form action={envoyer} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-ink">Nom de l'article</label>
          <input
            name="nom"
            required
            defaultValue={article?.nom}
            placeholder="ex. Chemise homme blanche"
            className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink">Taille / Pointure</label>
            <input
              name="taille"
              defaultValue={article?.taille ?? ""}
              placeholder="ex. M, 42"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Couleur</label>
            <input
              name="couleur"
              defaultValue={article?.couleur ?? ""}
              placeholder="ex. bleu"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink">Prix d'achat (F)</label>
            <input
              name="prixAchat"
              required
              inputMode="numeric"
              defaultValue={article?.prixAchat}
              placeholder="3000"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Prix de vente (F)</label>
            <input
              name="prixVente"
              required
              inputMode="numeric"
              defaultValue={article?.prixVente}
              placeholder="5000"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!articleId && (
            <div>
              <label className="text-sm font-medium text-ink">Quantité reçue</label>
              <input
                name="quantite"
                inputMode="numeric"
                defaultValue={article?.quantite ?? 1}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-brand"
              />
            </div>
          )}
          <div className={articleId ? "col-span-2" : ""}>
            <label className="text-sm font-medium text-ink">Unité</label>
            <select
              name="unite"
              defaultValue={article?.unite ?? "pièce"}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-line bg-white text-ink focus:outline-none focus:border-brand"
            >
              {UNITES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-danger text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 rounded-2xl bg-brand text-white font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 transition"
        >
          {pending ? <Loader2 size={20} className="animate-spin" /> : articleId ? "Enregistrer les modifications" : "Ajouter l'article"}
        </button>
      </form>
    </div>
  );
}