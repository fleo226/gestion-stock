'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, ShoppingCart, Check, X, Loader2, MessageSquare,
  Search, Share2, MapPin, Star,
} from 'lucide-react';

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

type Vendeur = {
  id: string;
  nom: string;
  couleur: string;
  boutiqueNom: string;
  boutiqueDescription: string | null;
  boutiqueLogoUrl: string | null;
  boutiqueWhatsApp: string | null;
  boutiqueAccentColor: string;
};

export default function BoutiquePage() {
  const params = useParams();
  const router = useRouter();
  const vendeurId = params.vendeurId as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inactive, setInactive] = useState(false);

  const [commande, setCommande] = useState<CommandeItem[]>([]);
  const [showCommande, setShowCommande] = useState(false);
  const [nomClient, setNomClient] = useState('');
  const [telClient, setTelClient] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // === Helper : sync commande avec localStorage ===
  const syncToStorage = (newCommande: CommandeItem[]) => {
    setCommande(newCommande);
    localStorage.setItem(`cart_${vendeurId}`, JSON.stringify(newCommande));
  };

  useEffect(() => {
    const fetchBoutique = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.data.articles);
          setVendeur(data.data.vendeur);
          // === LIRE LE PANIER DEPUIS LOCALSTORAGE AU CHARGEMENT ===
          const stored = localStorage.getItem(`cart_${vendeurId}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                setCommande(parsed);
              }
            } catch {}
          }
        } else if (data.inactive) {
          setInactive(true);
          setError(data.error || 'Cette boutique est inactive');
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

  const categories = useMemo(() => {
    const cats = new Map<string, { nom: string; couleur: string }>();
    articles.forEach(a => {
      if (a.categorie) cats.set(a.categorie.nom, a.categorie);
    });
    return Array.from(cats.values());
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = !search ||
        a.nom.toLowerCase().includes(search.toLowerCase()) ||
        (a.couleur && a.couleur.toLowerCase().includes(search.toLowerCase())) ||
        (a.taille && a.taille.toLowerCase().includes(search.toLowerCase()));
      const matchCat = !activeCategory || (a.categorie && a.categorie.nom === activeCategory);
      return matchSearch && matchCat;
    });
  }, [articles, search, activeCategory]);

  // === AJOUTER — sync localStorage ===
  const ajouterArticle = (articleId: string) => {
    const existe = commande.find(c => c.articleId === articleId);
    let newCommande;
    if (existe) {
      newCommande = commande.map(c => c.articleId === articleId ? { ...c, quantite: c.quantite + 1 } : c);
    } else {
      newCommande = [...commande, { articleId, quantite: 1, note: '' }];
    }
    syncToStorage(newCommande);
  };

  // === RETIRER — sync localStorage ===
  const retirerArticle = (articleId: string) => {
    const existe = commande.find(c => c.articleId === articleId);
    let newCommande;
    if (existe && existe.quantite > 1) {
      newCommande = commande.map(c => c.articleId === articleId ? { ...c, quantite: c.quantite - 1 } : c);
    } else {
      newCommande = commande.filter(c => c.articleId !== articleId);
    }
    syncToStorage(newCommande);
  };

  const getQuantite = (articleId: string) => commande.find(c => c.articleId === articleId)?.quantite || 0;

  const getTotal = () => {
    return commande.reduce((total, item) => {
      const article = articles.find(a => a.id === item.articleId);
      return total + (article ? article.prixVente * item.quantite : 0);
    }, 0);
  };

  const getTotalItems = () => commande.reduce((s, c) => s + c.quantite, 0);

  // === ALLER AU PANIER ===
  const allerAuPanier = () => {
    router.push(`/boutique/${vendeurId}/panier`);
  };

  const contacterVendeuse = () => {
    if (!vendeur?.boutiqueWhatsApp) return;
    const url = `https://wa.me/${vendeur.boutiqueWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Bonjour ${vendeur.boutiqueNom}, j'ai une question sur vos articles`)}`;
    window.open(url, '_blank');
  };

  const partagerBoutique = () => {
    const url = window.location.href;
    const text = `Découvrez la boutique "${vendeur?.boutiqueNom}" ! ${url}`;
    if (navigator.share) {
      navigator.share({ title: vendeur?.boutiqueNom || 'Boutique', text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full h-32 animate-pulse" style={{ backgroundColor: '#2563eb' }} />
        <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-gray-300 animate-pulse mx-auto mb-3 border-4 border-white" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (inactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm mx-4">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Boutique inactive</h1>
          <p className="text-gray-500 text-sm">{error || 'Cette boutique est temporairement inactive.'}</p>
        </div>
      </div>
    );
  }

  if (error || !vendeur) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm mx-4">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Boutique introuvable</h1>
          <p className="text-gray-500 text-sm">{error || 'Cette boutique n\'existe pas.'}</p>
        </div>
      </div>
    );
  }

  const accentColor = vendeur.boutiqueAccentColor || vendeur.couleur || '#2563eb';
  const boutiqueNomDisplay = vendeur.boutiqueNom || vendeur.nom;
  const hasLogo = !!vendeur.boutiqueLogoUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === HERO === */}
      <div className="relative">
        <div className="w-full h-28" style={{ backgroundColor: accentColor }} />
        <div className="absolute top-3 left-0 right-0 max-w-2xl mx-auto px-4 flex items-center justify-between">
          <button onClick={partagerBoutique} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition">
            <Share2 className="h-3.5 w-3.5" /> Partager
          </button>
          {vendeur.boutiqueWhatsApp && (
            <button onClick={contacterVendeuse} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-semibold shadow-sm transition">
              <MessageSquare className="h-3.5 w-3.5" /> Contacter
            </button>
          )}
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto shadow-xl border-4 border-white overflow-hidden">
            {hasLogo ? (
              <img src={vendeur.boutiqueLogoUrl!} alt={boutiqueNomDisplay} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: accentColor }}>
                {boutiqueNomDisplay.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{boutiqueNomDisplay}</h1>
          {vendeur.boutiqueDescription ? (
            <p className="text-sm text-gray-600 mt-1 px-4 max-w-md mx-auto">{vendeur.boutiqueDescription}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Bienvenue ! Découvrez nos articles ci-dessous</p>
          )}
          <div className="flex items-center justify-center gap-6 mt-4 pb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{articles.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Articles</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: accentColor }}>{getTotalItems()}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Panier</p>
            </div>
            {vendeur.boutiqueWhatsApp && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">✓</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">WhatsApp</p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-2 mb-4">
            {vendeur.boutiqueWhatsApp && (
              <button onClick={contacterVendeuse} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition" style={{ backgroundColor: accentColor }}>
                <MessageSquare className="h-4 w-4" /> Contacter sur WhatsApp
              </button>
            )}
            <button onClick={partagerBoutique} className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition">
              <Share2 className="h-4 w-4" /> Partager
            </button>
          </div>
        </div>
      </div>

      {/* === TRUST BADGES === */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg mb-0.5">📱</div>
            <p className="text-[10px] font-medium text-gray-700">Paiement</p>
            <p className="text-[9px] text-gray-400">Orange Money</p>
          </div>
          <div className="text-center border-l border-r border-gray-100">
            <div className="text-lg mb-0.5">💬</div>
            <p className="text-[10px] font-medium text-gray-700">Commande</p>
            <p className="text-[9px] text-gray-400">WhatsApp</p>
          </div>
          <div className="text-center">
            <div className="text-lg mb-0.5">🚚</div>
            <p className="text-[10px] font-medium text-gray-700">Livraison</p>
            <p className="text-[9px] text-gray-400">À convenir</p>
          </div>
        </div>
      </div>

      {/* === SEARCH + CATEGORIES === */}
      {articles.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>}
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${!activeCategory ? 'text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`} style={!activeCategory ? { backgroundColor: accentColor } : {}}>
                Tous
              </button>
              {categories.map((cat) => (
                <button key={cat.nom} onClick={() => setActiveCategory(activeCategory === cat.nom ? null : cat.nom)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${activeCategory === cat.nom ? 'text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`} style={activeCategory === cat.nom ? { backgroundColor: accentColor } : {}}>
                  {cat.nom}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === ARTICLES GRID === */}
      <main className="max-w-2xl mx-auto px-4">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun article disponible</h3>
            <p className="text-gray-500 text-sm">Cette boutique n'a pas encore d'articles en stock.</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun résultat</h3>
            <p className="text-gray-500 text-sm mb-3">Essayez une autre recherche</p>
            <button onClick={() => { setSearch(''); setActiveCategory(null); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">Réinitialiser</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredArticles.map(article => (
              <Link key={article.id} href={`/boutique/${vendeurId}/produit/${article.id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow block">
                <div className="aspect-square bg-gray-100 relative">
                  {article.photoUrl ? (
                    <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {article.couleur && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 text-xs font-medium rounded-full text-gray-700">{article.couleur}</span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 text-xs font-medium rounded-full" style={{ color: accentColor }}>{article.quantite} dispo</span>
                  {article.categorie && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: article.categorie.couleur }}>{article.categorie.nom}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{article.nom}</h3>
                  {article.taille && <p className="text-xs text-gray-500">Taille : {article.taille}</p>}
                  <p className="text-lg font-bold mt-1" style={{ color: accentColor }}>{article.prixVente.toLocaleString()}<span className="text-xs font-normal"> FCFA</span></p>
                  <div className="mt-2">
                    {getQuantite(article.id) === 0 ? (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); ajouterArticle(article.id); }} className="w-full py-2 rounded-xl text-white text-sm font-medium active:scale-95 transition-transform" style={{ backgroundColor: accentColor }}>Ajouter</button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 rounded-xl px-3 py-1">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); retirerArticle(article.id); }} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 active:bg-white rounded-lg text-lg font-bold">−</button>
                        <span className="font-semibold text-gray-900">{getQuantite(article.id)}</span>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); ajouterArticle(article.id); }} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 active:bg-white rounded-lg text-lg font-bold">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* === CART BAR — va vers la page panier === */}
      {commande.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{getTotalItems()} article(s)</p>
                <p className="text-xl font-bold" style={{ color: accentColor }}>{getTotal().toLocaleString()} FCFA</p>
              </div>
              <button onClick={allerAuPanier} className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium active:scale-95 transition-transform" style={{ backgroundColor: accentColor }}>
                <ShoppingCart className="h-5 w-5" /><span>Voir le panier →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === FLOATING WHATSAPP === */}
      {vendeur.boutiqueWhatsApp && commande.length === 0 && (
        <button onClick={contacterVendeuse} className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition z-40" aria-label="Contacter sur WhatsApp" title="Contacter la vendeuse">
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
