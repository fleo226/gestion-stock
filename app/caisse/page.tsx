'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Minus, ShoppingCart, Check, Package, Loader2, X, Hash, Smartphone, Banknote } from 'lucide-react';

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
};

type PanierItem = {
  article: Article;
  quantite: number;
};

export default function CaissePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [nomClient, setNomClient] = useState('');
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile'>('especes');
  const [montantRecu, setMontantRecu] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const rechercheRef = useRef<HTMLInputElement>(null);
  const [userColor, setUserColor] = useState('#2563eb');

  useEffect(() => {
    Promise.all([
      fetch('/api/stock').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([stockData, userData]) => {
      if (stockData.success) setArticles(stockData.data);
      if (userData.user?.couleur) setUserColor(userData.user.couleur);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showRecap) rechercheRef.current?.focus();
  }, [showRecap]);

  const filtered = articles.filter(a =>
    a.quantite > 0 && (
      a.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      a.couleur?.toLowerCase().includes(recherche.toLowerCase()) ||
      a.taille?.toLowerCase().includes(recherche.toLowerCase())
    )
  );

  const ajouterAuPanier = (article: Article) => {
    const existe = panier.find(p => p.article.id === article.id);
    if (existe) {
      if (existe.quantite < article.quantite) {
        setPanier(panier.map(p => p.article.id === article.id ? { ...p, quantite: p.quantite + 1 } : p));
      }
    } else {
      setPanier([...panier, { article, quantite: 1 }]);
    }
  };

  const incrementer = (articleId: string) => {
    const item = panier.find(p => p.article.id === articleId);
    if (item && item.quantite < item.article.quantite) {
      setPanier(panier.map(p => p.article.id === articleId ? { ...p, quantite: p.quantite + 1 } : p));
    }
  };

  const decrementer = (articleId: string) => {
    const item = panier.find(p => p.article.id === articleId);
    if (item && item.quantite > 1) {
      setPanier(panier.map(p => p.article.id === articleId ? { ...p, quantite: p.quantite - 1 } : p));
    } else {
      setPanier(panier.filter(p => p.article.id !== articleId));
    }
  };

  const totalPanier = panier.reduce((sum, p) => sum + (p.article.prixVente * p.quantite), 0);
  const totalArticles = panier.reduce((sum, p) => sum + p.quantite, 0);
  const monnaie = montantRecu ? Math.max(0, parseInt(montantRecu) - totalPanier) : 0;

  const validerVente = async () => {
    setSending(true);
    try {
      for (const item of panier) {
        await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sortie',
            articleId: item.article.id,
            quantite: item.quantite,
            prixUnitaire: item.article.prixVente,
            note: `Caisse ${modePaiement === 'mobile' ? 'Mobile Money' : 'Espèces'}${nomClient ? ` • ${nomClient}` : ''}`,
          }),
        });
      }
      setSent(true);
      setTimeout(() => {
        setPanier([]);
        setShowRecap(false);
        setNomClient('');
        setMontantRecu('');
        setSent(false);
        setRecherche('');
      }, 2000);
    } catch {
      alert('Erreur lors de la validation');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: userColor }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <Link href="/stock" className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-xl touch-manipulation">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Caisse</h1>
                <p className="text-xs text-gray-500">Mode encaissement rapide</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Panier</span>
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {totalArticles > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: userColor }}>
                    {totalArticles}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={rechercheRef}
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {recherche && (
            <button onClick={() => setRecherche('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4">
        {/* Article Grid */}
        <div className="flex-1 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{recherche ? 'Aucun résultat' : 'Aucun article disponible'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map(article => {
                const inPanier = panier.find(p => p.article.id === article.id);
                return (
                  <button
                    key={article.id}
                    onClick={() => ajouterAuPanier(article)}
                    className={`bg-white rounded-xl p-3 border text-left transition-all active:scale-95 touch-manipulation ${
                      inPanier ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {article.photoUrl ? (
                          <img src={article.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-gray-300">{article.nom.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{article.nom}</p>
                        {article.taille && <p className="text-xs text-gray-500">{article.taille} {article.couleur || ''}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm" style={{ color: userColor }}>{article.prixVente.toLocaleString()} F</p>
                      {inPanier && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: userColor }}>
                          ×{inPanier.quantite}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panier Fixe en bas */}
        {panier.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t pt-3 pb-4 px-4 -mx-4" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
            {/* Résumé panier */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">{totalArticles} article(s)</p>
                  <p className="text-xl font-bold" style={{ color: userColor }}>{totalPanier.toLocaleString()} FCFA</p>
                </div>
                <button
                  onClick={() => setShowRecap(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-semibold active:scale-95 transition-transform"
                  style={{ backgroundColor: userColor }}
                >
                  <Check className="h-5 w-5" />
                  <span>Encaisser</span>
                </button>
              </div>

              {/* Mini-items */}
              <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {panier.map(item => (
                  <div key={item.article.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">{item.article.nom}</span>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => decrementer(item.article.id)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 bg-white rounded">-</button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantite}</span>
                      <button onClick={() => incrementer(item.article.id)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-500 bg-white rounded">+</button>
                    </div>
                    <span className="text-xs text-gray-500">{(item.article.prixVente * item.quantite).toLocaleString()} F</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Recap / Paiement */}
      {showRecap && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => !sending && setShowRecap(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-12 px-6">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${userColor}15` }}>
                  <Check className="h-10 w-10" style={{ color: userColor }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Vente enregistrée !</h3>
                <p className="text-gray-500">Le stock a été mis à jour automatiquement.</p>
              </div>
            ) : (
              <div className="p-6 max-h-[85vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Récapitulatif</h3>

                {/* Articles */}
                <div className="space-y-2 mb-4">
                  {panier.map(item => (
                    <div key={item.article.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.article.nom}</p>
                        <p className="text-sm text-gray-500">{item.quantite} × {item.article.prixVente.toLocaleString()} F</p>
                      </div>
                      <p className="font-semibold">{(item.article.prixVente * item.quantite).toLocaleString()} F</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-3 border-t-2 border-gray-900 font-bold text-xl">
                  <span>TOTAL</span>
                  <span style={{ color: userColor }}>{totalPanier.toLocaleString()} FCFA</span>
                </div>

                {/* Mode de paiement */}
                <div className="mt-4 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Mode de paiement</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setModePaiement('especes')}
                      className={`p-3 rounded-xl border-2 flex items-center justify-center space-x-2 font-medium transition-all ${
                        modePaiement === 'especes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                      <span>Espèces</span>
                    </button>
                    <button
                      onClick={() => setModePaiement('mobile')}
                      className={`p-3 rounded-xl border-2 flex items-center justify-center space-x-2 font-medium transition-all ${
                        modePaiement === 'mobile' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Smartphone className="h-5 w-5" />
                      <span>Mobile Money</span>
                    </button>
                  </div>
                </div>

                {/* Montant reçu (espèces) */}
                {modePaiement === 'especes' && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Montant reçu</p>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={montantRecu}
                      onChange={e => setMontantRecu(e.target.value)}
                      placeholder={`${totalPanier.toLocaleString()}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {parseInt(montantRecu) >= totalPanier && (
                      <div className="mt-2 flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <span className="text-sm text-green-700">Monnaie à rendre</span>
                        <span className="font-bold text-green-700">{monnaie.toLocaleString()} FCFA</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nom client */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Nom du client (optionnel)</p>
                  <input
                    type="text"
                    value={nomClient}
                    onChange={e => setNomClient(e.target.value)}
                    placeholder="Ex: Aminata"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRecap(false)}
                    disabled={sending}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium active:bg-gray-200 touch-manipulation"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={validerVente}
                    disabled={sending}
                    className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform touch-manipulation"
                    style={{ backgroundColor: userColor }}
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /><span>Valider</span></>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}