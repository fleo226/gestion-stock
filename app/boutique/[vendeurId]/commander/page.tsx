'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Loader2, Lock, ArrowRight } from 'lucide-react';

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

export default function CommanderPage() {
  const params = useParams();
  const router = useRouter();
  const vendeurId = params.vendeurId as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [adresse, setAdresse] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.data.articles);
          setVendeur(data.data.vendeur);
          const stored = JSON.parse(localStorage.getItem(`cart_${vendeurId}`) || '[]');
          setCart(stored);
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendeurId]);

  const getArticle = (id: string) => articles.find(a => a.id === id);

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const article = getArticle(item.articleId);
      return total + (article ? article.prixVente * item.quantite : 0);
    }, 0);
  };

  const getTotalItems = () => cart.reduce((s, c) => s + c.quantite, 0);

  const getArticlesNames = () => {
    return cart.map(item => {
      const a = getArticle(item.articleId);
      return a ? a.nom : '';
    }).filter(Boolean).join(' + ');
  };

  // Validation téléphone burkinabè (8 chiffres)
  const validateTel = (phone: string) => {
    const clean = phone.replace(/[\s\-]/g, '');
    // Accepte: 70123456, 0701234567, +22670123456, 22670123456
    const digits = clean.replace(/\D/g, '');
    return digits.length >= 8;
  };

  const handleSubmit = async () => {
    setError('');

    if (!nom.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (!validateTel(tel)) {
      setError('Numéro WhatsApp invalide (8 chiffres minimum)');
      return;
    }
    if (!adresse.trim()) {
      setError('Veuillez entrer votre adresse de livraison');
      return;
    }
    if (cart.length === 0) {
      setError('Votre panier est vide');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendeurId,
          clientNom: nom.trim(),
          clientTel: tel.trim(),
          clientAdresse: adresse.trim(),
          clientNote: note.trim() || null,
          items: cart.map(item => ({
            articleId: item.articleId,
            quantite: item.quantite,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        // Vider le panier
        localStorage.removeItem(`cart_${vendeurId}`);
        // Rediriger vers la page de paiement
        router.push(`/boutique/${vendeurId}/commande/${data.data.id}`);
      } else {
        setError(data.error || 'Erreur lors de la création de la commande');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Panier vide</h3>
          <p className="text-gray-500 text-sm mb-4">Ajoutez des articles avant de commander</p>
          <button
            onClick={() => router.push(`/boutique/${vendeurId}`)}
            className="px-5 py-2.5 text-white rounded-xl text-sm font-medium"
            style={{ backgroundColor: accentColor }}
          >
            Voir les articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === Header === */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <button onClick={() => router.push(`/boutique/${vendeurId}/panier`)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Finaliser la commande</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* === Recap compact === */}
        <div className="rounded-xl p-3 flex items-center justify-between text-xs" style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{getTotalItems()} article(s)</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-600 truncate max-w-[150px]">{getArticlesNames()}</span>
          </div>
          <span className="font-bold" style={{ color: accentColor }}>
            {getTotal().toLocaleString()} FCFA
          </span>
        </div>

        {/* === Message d'erreur === */}
        {error && (
          <div className="p-3 rounded-xl text-sm border bg-red-50 text-red-700 border-red-200">
            {error}
          </div>
        )}

        {/* === Formulaire === */}
        <div className="space-y-3">
          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Aminata Traoré"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Téléphone WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Téléphone WhatsApp <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
                🇧🇫 +226
              </span>
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="70 12 34 56"
                className="flex-1 bg-white border border-gray-300 rounded-r-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Numéro pour la confirmation WhatsApp</p>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quartier / Adresse de livraison <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: Ouaga 2000, près de la pharmacie"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Note spéciale <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Livrer de préférence après 16h..."
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </main>

      {/* === Sticky bottom === */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-md">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting || !nom.trim() || !tel.trim() || !adresse.trim()}
            className="w-full text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
            style={{ backgroundColor: accentColor }}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Confirmer la commande</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-gray-500 mt-1.5">
            Vous serez redirigé vers Orange Money
          </p>
        </div>
      </div>
    </div>
  );
}
