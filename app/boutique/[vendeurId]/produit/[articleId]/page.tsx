'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, ShoppingCart, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';

type Article = {
  id: string;
  nom: string;
  taille: string | null;
  couleur: string | null;
  prixAchat: number;
  prixVente: number;
  quantite: number;
  unite: string;
  photoUrl: string | null;
  categorie?: { nom: string; couleur: string } | null;
};

type Vendeur = {
  id: string;
  nom: string;
  couleur: string;
  boutiqueNom: string;
  boutiqueWhatsApp: string | null;
  boutiqueAccentColor: string;
};

export default function FicheProduitPage() {
  const params = useParams();
  const router = useRouter();
  const vendeurId = params.vendeurId as string;
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}`);
        const data = await res.json();
        if (data.success) {
          setVendeur(data.data.vendeur);
          const found = data.data.articles.find((a: Article) => a.id === articleId);
          if (found) {
            setArticle(found);
          } else {
            setError('Article introuvable');
          }
        } else {
          setError(data.error || 'Boutique introuvable');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [vendeurId, articleId]);

  const addToCart = () => {
    if (!article) return;
    const cartKey = `cart_${vendeurId}`;
    const existing = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const found = existing.find((item: { articleId: string; quantite: number }) => item.articleId === article.id);
    if (found) {
      found.quantite += quantite;
    } else {
      existing.push({ articleId: article.id, quantite });
    }
    localStorage.setItem(cartKey, JSON.stringify(existing));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article || !vendeur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || 'Article introuvable'}</p>
          <button onClick={() => router.push(`/boutique/${vendeurId}`)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const accentColor = vendeur.boutiqueAccentColor || vendeur.couleur || '#2563eb';
  const enStock = article.quantite > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === Grande photo === */}
      <div className="relative bg-gray-100 aspect-square flex items-center justify-center">
        {article.photoUrl ? (
          <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
        ) : (
          <Package className="h-24 w-24 text-gray-300" />
        )}

        {/* Bouton retour */}
        <button
          onClick={() => router.push(`/boutique/${vendeurId}`)}
          className="absolute top-4 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        {/* Badge stock */}
        {enStock ? (
          <span className="absolute top-4 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {article.quantite} en stock
          </span>
        ) : (
          <span className="absolute top-4 right-3 bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
            Rupture
          </span>
        )}
      </div>

      {/* === Infos produit === */}
      <div className="p-4 space-y-4">
        {/* Catégorie + nom + prix */}
        <div>
          {article.categorie && (
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: accentColor }}>
              {article.categorie.nom}
            </p>
          )}
          <h1 className="text-lg font-bold text-gray-900">{article.nom}</h1>
          <p className="text-xl font-bold mt-1" style={{ color: accentColor }}>
            {article.prixVente.toLocaleString()} FCFA
          </p>
        </div>

        {/* Taille + couleur */}
        {(article.taille || article.couleur) && (
          <div className="flex items-center gap-3 text-sm">
            {article.taille && (
              <span className="text-gray-500">Taille : <strong className="text-gray-900">{article.taille}</strong></span>
            )}
            {article.taille && article.couleur && <span className="text-gray-300">•</span>}
            {article.couleur && (
              <span className="text-gray-500">Couleur : <strong className="text-gray-900">{article.couleur}</strong></span>
            )}
          </div>
        )}

        {/* Sélecteur quantité */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Quantité</label>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            <button
              onClick={() => setQuantite(Math.max(1, quantite - 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-bold text-gray-900 w-8 text-center">{quantite}</span>
            <button
              onClick={() => setQuantite(Math.min(article.quantite, quantite + 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-400 ml-2">max {article.quantite}</span>
          </div>
        </div>

        {/* Garanties */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-around text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4" style={{ color: accentColor }} />
              <span>Livraison Ouaga</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} />
              <span>Vendeuse certifiée</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Sticky bottom bar === */}
      {enStock ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 px-2 py-1">
              <button onClick={() => setQuantite(Math.max(1, quantite - 1))} className="text-gray-500 font-bold px-2 text-sm">
                −
              </button>
              <span className="text-sm font-bold text-gray-900 px-2">{quantite}</span>
              <button onClick={() => setQuantite(Math.min(article.quantite, quantite + 1))} className="text-gray-500 font-bold px-2 text-sm">
                +
              </button>
            </div>
            <button
              onClick={addToCart}
              className="flex-1 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition"
              style={{ backgroundColor: accentColor }}
            >
              {added ? (
                <>✓ Ajouté au panier</>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter au panier
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40">
          <div className="max-w-2xl mx-auto">
            <button
              disabled
              className="w-full bg-gray-200 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed"
            >
              Article en rupture
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
