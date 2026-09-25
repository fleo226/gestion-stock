'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Minus, Plus, Trash2, ShoppingCart, Lock } from 'lucide-react';

type Article = {
  id: string;
  nom: string;
  taille: string | null;
  couleur: string | null;
  prixVente: number;
  quantite: number;
  photoUrl: string | null;
};

type Vendeur = {
  id: string;
  nom: string;
  couleur: string;
  boutiqueNom: string;
  boutiqueAccentColor: string;
};

type CartItem = {
  articleId: string;
  quantite: number;
};

export default function PanierPage() {
  const params = useParams();
  const router = useRouter();
  const vendeurId = params.vendeurId as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.data.articles);
          setVendeur(data.data.vendeur);
          // Lire le panier depuis localStorage
          const cartKey = `cart_${vendeurId}`;
          const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
          setCart(stored);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendeurId]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`cart_${vendeurId}`, JSON.stringify(newCart));
  };

  const getArticle = (id: string) => articles.find(a => a.id === id);

  const updateQuantite = (articleId: string, delta: number) => {
    const item = cart.find(c => c.articleId === articleId);
    if (!item) return;
    const article = getArticle(articleId);
    if (!article) return;
    const newQte = item.quantite + delta;
    if (newQte <= 0) {
      saveCart(cart.filter(c => c.articleId !== articleId));
    } else if (newQte <= article.quantite) {
      saveCart(cart.map(c => c.articleId === articleId ? { ...c, quantite: newQte } : c));
    }
  };

  const removeItem = (articleId: string) => {
    saveCart(cart.filter(c => c.articleId !== articleId));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const article = getArticle(item.articleId);
      return total + (article ? article.prixVente * item.quantite : 0);
    }, 0);
  };

  const getTotalItems = () => cart.reduce((s, c) => s + c.quantite, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendeur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500">Boutique introuvable</p>
      </div>
    );
  }

  const accentColor = vendeur.boutiqueAccentColor || vendeur.couleur || '#2563eb';
  const cartItems = cart.map(item => ({
    ...item,
    article: getArticle(item.articleId),
  })).filter(item => item.article);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === Header === */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/boutique/${vendeurId}`)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-sm font-bold text-gray-900">Mon panier</h1>
          </div>
          {cartItems.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
              {getTotalItems()} article(s)
            </span>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {cartItems.length === 0 ? (
          /* === Empty state === */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Votre panier est vide</h3>
            <p className="text-gray-500 text-sm mb-5">Découvrez les articles disponibles dans la boutique</p>
            <button
              onClick={() => router.push(`/boutique/${vendeurId}`)}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-medium active:scale-95 transition"
              style={{ backgroundColor: accentColor }}
            >
              Voir les articles
            </button>
          </div>
        ) : (
          <>
            {/* === Articles === */}
            <div className="space-y-2 mb-4">
              {cartItems.map(({ articleId, quantite, article }) => (
                <div key={articleId} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                  {/* Photo */}
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {article!.photoUrl ? (
                      <img src={article!.photoUrl} alt={article!.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{article!.nom}</h3>
                      <button
                        onClick={() => removeItem(articleId)}
                        className="text-gray-400 hover:text-red-500 ml-1 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {(article!.taille || article!.couleur) && (
                      <p className="text-[10px] text-gray-500">
                        {article!.taille && `Taille: ${article!.taille}`}
                        {article!.taille && article!.couleur && ' • '}
                        {article!.couleur && `Couleur: ${article!.couleur}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {(article!.prixVente * quantite).toLocaleString()} FCFA
                      </span>
                      {/* Quantité */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() => updateQuantite(articleId, -1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 w-7 text-center">{quantite}</span>
                        <button
                          onClick={() => updateQuantite(articleId, 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-green-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* === Récapitulatif === */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span className="font-medium text-gray-900">{getTotal().toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frais de livraison</span>
                <span className="font-bold text-green-600">Gratuit</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Total à payer</span>
                <span className="text-lg font-bold" style={{ color: accentColor }}>
                  {getTotal().toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* === Sticky bottom bar === */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-md">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push(`/boutique/${vendeurId}/commander`)}
              className="w-full text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition"
              style={{ backgroundColor: accentColor }}
            >
              <span>Commander maintenant</span>
              <span>→</span>
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-1.5 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Vous recevrez les instructions Orange Money
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
