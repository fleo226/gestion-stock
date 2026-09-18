'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Package, ShoppingCart, Check, X, Loader2, MessageSquare } from 'lucide-react';

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

type CommandeItem = {
  articleId: string;
  quantite: number;
  note: string;
};

export default function BoutiquePage() {
  const params = useParams();
  const vendeurId = params.vendeurId as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [vendeur, setVendeur] = useState<{ nom: string; couleur: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commande, setCommande] = useState<CommandeItem[]>([]);
  const [showCommande, setShowCommande] = useState(false);
  const [nomClient, setNomClient] = useState('');
  const [telClient, setTelClient] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchBoutique = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.data.articles);
          setVendeur(data.data.vendeur);
        } else {
          setError(data.error || 'Boutique introuvable');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    fetchBoutique();
  }, [vendeurId]);

  const ajouterArticle = (articleId: string) => {
    const existe = commande.find(c => c.articleId === articleId);
    if (existe) {
      setCommande(commande.map(c => c.articleId === articleId ? { ...c, quantite: c.quantite + 1 } : c));
    } else {
      setCommande([...commande, { articleId, quantite: 1, note: '' }]);
    }
  };

  const retirerArticle = (articleId: string) => {
    const existe = commande.find(c => c.articleId === articleId);
    if (existe && existe.quantite > 1) {
      setCommande(commande.map(c => c.articleId === articleId ? { ...c, quantite: c.quantite - 1 } : c));
    } else {
      setCommande(commande.filter(c => c.articleId !== articleId));
    }
  };

  const getQuantite = (articleId: string) => commande.find(c => c.articleId === articleId)?.quantite || 0;

  const getTotal = () => {
    return commande.reduce((total, item) => {
      const article = articles.find(a => a.id === item.articleId);
      return total + (article ? article.prixVente * item.quantite : 0);
    }, 0);
  };

  const envoyerCommande = async () => {
    if (!nomClient.trim()) { alert('Veuillez entrer votre nom'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendeurId,
          clientNom: nomClient.trim(),
          clientTel: telClient.trim() || null,
          items: commande.map(item => ({ articleId: item.articleId, quantite: item.quantite, note: item.note || null })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setTimeout(() => { setShowCommande(false); setSent(false); setCommande([]); setNomClient(''); setTelClient(''); }, 3000);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi');
      }
    } catch { alert('Erreur de connexion'); }
    finally { setSending(false); }
  };

  const ouvrirWhatsApp = () => {
    const texte = commande.map(item => {
      const article = articles.find(a => a.id === item.articleId);
      if (!article) return '';
      return `• ${article.nom} (x${item.quantite}) - ${(article.prixVente * item.quantite).toLocaleString()} FCFA`;
    }).filter(Boolean).join('\n');
    const message = `Bonjour ! Je souhaite commander :\n\n${texte}\n\nTotal : ${getTotal().toLocaleString()} FCFA\n\nMerci !`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  if (error || !vendeur) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none max-w-sm mx-4">
        <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Boutique introuvable</h1>
        <p className="text-gray-500 dark:text-gray-400">{error || 'Cette boutique n\'existe pas ou n\'est plus active.'}</p>
      </div>
    </div>
  );

  const accentColor = vendeur.couleur || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: accentColor }}>
                {vendeur.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{vendeur.nom}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{articles.length} articles</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Catalogue</p>
              <p className="text-sm font-medium" style={{ color: accentColor }}>Commandez !</p>
            </div>
          </div>
        </div>
      </header>

      {/* Articles */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun article disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {articles.filter(a => a.quantite > 0).map(article => (
              <div key={article.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
                {/* Photo */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                  {article.photoUrl ? (
                    <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {article.couleur && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 dark:bg-gray-800/90 text-xs font-medium rounded-full text-gray-700 dark:text-gray-300">
                      {article.couleur}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 dark:bg-gray-800/90 text-xs font-medium rounded-full" style={{ color: accentColor }}>
                    {article.quantite} dispo
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{article.nom}</h3>
                  {article.taille && <p className="text-xs text-gray-500 dark:text-gray-400">Taille : {article.taille}</p>}
                  <p className="text-lg font-bold mt-1" style={{ color: accentColor }}>
                    {article.prixVente.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                  </p>

                  {/* Add to cart */}
                  <div className="mt-2">
                    {getQuantite(article.id) === 0 ? (
                      <button onClick={() => ajouterArticle(article.id)} className="w-full py-2 rounded-xl text-white text-sm font-medium active:scale-95 transition-transform" style={{ backgroundColor: accentColor }}>
                        Ajouter
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-1">
                        <button onClick={() => retirerArticle(article.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-600 active:bg-white dark:active:bg-gray-600 rounded-lg">-</button>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{getQuantite(article.id)}</span>
                        <button onClick={() => ajouterArticle(article.id)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 active:bg-white dark:active:bg-gray-600 rounded-lg">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Bar */}
      {commande.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{commande.length} article(s)</p>
                <p className="text-xl font-bold" style={{ color: accentColor }}>{getTotal().toLocaleString()} FCFA</p>
              </div>
              <button onClick={() => setShowCommande(true)} className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium active:scale-95 transition-transform" style={{ backgroundColor: accentColor }}>
                <ShoppingCart className="h-5 w-5" />
                <span>Commander</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commande Modal */}
      {showCommande && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowCommande(false)}>
          <div className="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Commande envoyée !</h3>
                <p className="text-gray-500 dark:text-gray-400">Le vendeur vous contactera bientôt.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ma commande</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {commande.map(item => {
                    const article = articles.find(a => a.id === item.articleId);
                    if (!article) return null;
                    return (
                      <div key={item.articleId} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{article.nom}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">x{item.quantite} • {article.prixVente.toLocaleString()} FCFA/u</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{(article.prixVente * item.quantite).toLocaleString()} FCFA</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 font-bold text-lg text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span style={{ color: accentColor }}>{getTotal().toLocaleString()} FCFA</span>
                </div>
                <div className="space-y-3 mb-4">
                  <input type="text" value={nomClient} onChange={e => setNomClient(e.target.value)} placeholder="Votre nom *" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100" />
                  <input type="tel" value={telClient} onChange={e => setTelClient(e.target.value)} placeholder="Téléphone (optionnel)" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100" />
                </div>
                <div className="space-y-3">
                  <button onClick={envoyerCommande} disabled={sending || !nomClient.trim()} className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 transition-transform" style={{ backgroundColor: accentColor }}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /><span>Confirmer la commande</span></>}
                  </button>
                  <button onClick={ouvrirWhatsApp} className="w-full py-3 rounded-xl bg-green-500 text-white font-medium flex items-center justify-center space-x-2 active:scale-95 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                    <span>Envoyer par WhatsApp</span>
                  </button>
                  <button onClick={() => setShowCommande(false)} className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium active:bg-gray-200 dark:active:bg-gray-600">
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
