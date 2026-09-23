'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, Menu, X, TrendingUp, Package, DollarSign, ArrowUpRight, ArrowDownRight, Search, ChevronRight, User, Settings, Activity, BarChart3, Bot, Download, ShoppingBag, XCircle, CheckCircle, Clock, Eye, MessageSquare, Hourglass, Badge, Truck, MapPin } from 'lucide-react';
import { formatPhone } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Badge as BadgeComponent } from '@/components/ui/Badge';

type Categorie = { id: string; nom: string; couleur: string };

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
  creeLe: string;
  entreeTotal: number;
  vendu: number;
  valeurStock: number;
  benefice: number;
  ca: number;
  categorieId: string | null;
  categorie: { id: string; nom: string; couleur: string } | null;
};

type CommandeWeb = {
  id: string;
  clientNom: string;
  clientTelephone: string | null;
  clientAdresse: string | null;
  total: number;
  statut: 'EN_ATTENTE_PAIEMENT' | 'EN_ATTENTE_VALIDATION' | 'CONFIRMEE' | 'ANNULEE';
  referencePaiement: string | null;
  creeLe: string;
  valideeLe: string | null;
  lignes: {
    id: string;
    quantite: number;
    prixUnitaire: number;
    article: { id: string; nom: string; taille: string | null; couleur: string | null; photoUrl: string | null };
  }[];
};

type VendeurInfo = {
  id: string;
  nom: string;
  couleur: string;
  whatsapp?: string | null;
};

export default function StockPage() {
  const router = useRouter();
  const [user, setUser] = useState<VendeurInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const [activeTab, setActiveTab] = useState<'stock' | 'commandes'>('stock');
  const [articles, setArticles] = useState<Article[]>([]);
  const [commandes, setCommandes] = useState<CommandeWeb[]>([]);
  const [stats, setStats] = useState({ totalArticles: 0, valeurStock: 0, benefice: 0, ca: 0, totalVendu: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [validatingCommande, setValidatingCommande] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [articlesRes, statsRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/stock?action=stats')
      ]);
      const articlesData = await articlesRes.json();
      const statsData = await statsRes.json();
      if (articlesData.success) setArticles(articlesData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommandes = async () => {
    try {
      const res = await fetch('/api/commandes');
      const data = await res.json();
      if (data.success) setCommandes(data.data);
    } catch (error) {
      console.error('Erreur commandes:', error);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'commandes') fetchCommandes();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setArticles(articles.filter(a => a.id !== id));
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur de connexion');
    } finally {
      setDeleting(null);
    }
  };

  const validateCommande = async (commandeId: string) => {
    if (!confirm('Confirmer le paiement et valider cette commande ? Le stock sera décrémenté.')) return;
    setValidatingCommande(commandeId);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', commandeId })
      });
      const data = await res.json();
      if (data.success) {
        fetchCommandes();
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch {
      alert('Erreur de connexion');
    } finally {
      setValidatingCommande(null);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  const filteredArticles = articles.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    (a.taille && a.taille.toLowerCase().includes(search.toLowerCase())) ||
    (a.couleur && a.couleur.toLowerCase().includes(search.toLowerCase()))
  );

  const accentColor = user?.couleur || '#2563eb';

  // === FIX BUG 1 : fonction handleLogout propre ===
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
      router.refresh();
    } catch (e) {
      console.error('Erreur logout:', e);
    }
  };

  const handleExport = () => {
    const headers = ['Nom', 'Catégorie', 'Quantité', 'Prix Achat (FCFA)', 'Prix Vente (FCFA)', 'Valeur Stock (FCFA)'];
    const rows = articles.map(a => [
      a.nom,
      a.categorie?.nom || '',
      String(a.quantite),
      String(a.prixAchat),
      String(a.prixVente),
      String(a.valeurStock),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusConfig = (statut: CommandeWeb['statut']) => {
    switch (statut) {
      case 'EN_ATTENTE_PAIEMENT': return { label: 'En attente paiement', color: 'orange' as const, icon: Clock, bg: 'bg-orange-50 border-orange-100 text-orange-700', textColor: 'text-orange-700' };
      case 'EN_ATTENTE_VALIDATION': return { label: 'En attente validation', color: 'blue' as const, icon: Hourglass, bg: 'bg-blue-50 border-blue-100 text-blue-700', textColor: 'text-blue-700' };
      case 'CONFIRMEE': return { label: 'Confirmée', color: 'green' as const, icon: CheckCircle, bg: 'bg-green-50 border-green-100 text-green-700', textColor: 'text-green-700' };
      case 'ANNULEE': return { label: 'Annulée', color: 'gray' as const, icon: XCircle, bg: 'bg-gray-50 border-gray-100 text-gray-700', textColor: 'text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/assistant" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </Link>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Ma Boutique</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stats.totalArticles} articles</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={handleExport} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl active:bg-emerald-100 touch-manipulation transition-colors" title="Exporter CSV">
                <Download className="h-5 w-5" />
              </button>
              <Link href="/caisse" className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl active:bg-blue-100 touch-manipulation transition-colors" title="Caisse">
                <DollarSign className="h-5 w-5" />
              </Link>
              <Link href="/stats" className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl active:bg-purple-100 touch-manipulation transition-colors" title="Statistiques">
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link href="/parametres" className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl active:bg-gray-200 touch-manipulation transition-colors" title="Paramètres">
                <Settings className="h-5 w-5" />
              </Link>
              {/* === FIX BUG 1 : bouton déconnexion compact (icône) + redirection propre === */}
              <button onClick={handleLogout} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl active:bg-red-100 touch-manipulation transition-colors" title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {user && (
          <div className="mb-5 p-4 rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
            <p className="text-sm text-white/80">Bienvenue,</p>
            <h2 className="text-xl font-bold text-white">{user.nom}</h2>
            {/* === FIX BUG 2 : grid-cols-2 pour aligner les 2 stats === */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-white/20 px-3 py-2 rounded-lg text-center">
                <p className="text-xs text-white/80">Valeur stock</p>
                <p className="text-sm font-bold text-white">{formatPrice(stats.valeurStock)}</p>
              </div>
              <div className="bg-white/20 px-3 py-2 rounded-lg text-center">
                <p className="text-xs text-white/80">Bénéfice</p>
                <p className="text-sm font-bold text-white">{formatPrice(stats.benefice)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'stock'}
              onClick={() => setActiveTab('stock')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                activeTab === 'stock'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Stock</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'commandes'}
              onClick={() => setActiveTab('commandes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                activeTab === 'commandes'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Commandes Web</span>
              {commandes.filter(c => c.statut === 'EN_ATTENTE_VALIDATION').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {commandes.filter(c => c.statut === 'EN_ATTENTE_VALIDATION').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'stock' && (
          <>
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
              <StatPill icon={<Package className="h-4 w-4" />} label="Articles" value={String(stats.totalArticles)} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
              <StatPill icon={<DollarSign className="h-4 w-4" />} label="Stock" value={formatPrice(stats.valeurStock)} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/30" />
              <StatPill icon={<TrendingUp className="h-4 w-4" />} label="Vendus" value={String(stats.totalVendu)} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/30" />
              <StatPill icon={<ArrowUpRight className="h-4 w-4" />} label="CA" value={formatPrice(stats.ca)} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/30" />
            </div>

            <div className="flex space-x-3 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <Link href="/article/nouveau" className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg dark:shadow-gray-900/30 active:shadow-md transition-shadow touch-manipulation" style={{ backgroundColor: accentColor }}>
                <Plus className="h-6 w-6" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{search ? 'Aucun résultat' : 'Aucun article'}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">{search ? 'Essayez une autre recherche' : 'Ajoutez votre premier article pour commencer'}</p>
                {!search && (
                  <Link href="/article/nouveau" className="inline-flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl text-base font-medium touch-manipulation" style={{ backgroundColor: accentColor }}>
                    <Plus className="h-5 w-5" />
                    <span>Ajouter un article</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
                    <Link href={`/article/${article.id}`} className="block p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {article.photoUrl ? (
                            <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }} />
                          ) : (
                            <span className="text-xl font-bold text-gray-300 dark:text-gray-600">{article.nom.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{article.nom}</h3>
                            {article.categorie && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex-shrink-0" style={{ backgroundColor: article.categorie.couleur }}>
                                {article.categorie.nom}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            {article.taille && <span>{article.taille}</span>}
                            {article.taille && article.couleur && <span>·</span>}
                            {article.couleur && <span>{article.couleur}</span>}
                            <span>·</span>
                            <span className="font-medium" style={{ color: article.quantite > 0 ? accentColor : '#ef4444' }}>
                              {article.quantite} {article.unite}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPrice(article.prixVente)}</p>
                          {article.vendu > 0 && <p className="text-xs text-green-600 dark:text-green-400">+{formatPrice(article.benefice)}</p>}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'commandes' && (
          <CommandesTab
            commandes={commandes}
            loading={activeTab === 'commandes' && commandes.length === 0 && !loading}
            onValidate={validateCommande}
            validatingId={validatingCommande}
            accentColor={accentColor}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        )}
      </main>

      {activeTab === 'stock' && (
        <Link href="/article/nouveau" className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl dark:shadow-gray-900/30 active:shadow-md transition-all touch-manipulation z-40" style={{ backgroundColor: accentColor }}>
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}

function StatPill({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${bg} flex-shrink-0`}>
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

interface CommandesTabProps {
  commandes: CommandeWeb[];
  loading: boolean;
  onValidate: (id: string) => void;
  validatingId: string | null;
  accentColor: string;
  formatPrice: (price: number) => string;
  formatDate: (dateStr: string) => string;
}

function CommandesTab({ commandes, loading, onValidate, validatingId, accentColor, formatPrice, formatDate }: CommandesTabProps) {
  const router = useRouter();
  const [user, setUser] = useState<VendeurInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const vendeur = user;

  const getStatusConfig = (statut: CommandeWeb['statut']) => {
    switch (statut) {
      case 'EN_ATTENTE_PAIEMENT': return { label: 'En attente paiement', color: 'orange' as const, icon: Clock, bg: 'bg-orange-50 border-orange-100 text-orange-700' };
      case 'EN_ATTENTE_VALIDATION': return { label: 'En attente validation', color: 'blue' as const, icon: Hourglass, bg: 'bg-blue-50 border-blue-100 text-blue-700' };
      case 'CONFIRMEE': return { label: 'Confirmée', color: 'green' as const, icon: CheckCircle, bg: 'bg-green-50 border-green-100 text-green-700' };
      case 'ANNULEE': return { label: 'Annulée', color: 'gray' as const, icon: XCircle, bg: 'bg-gray-50 border-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (commandes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune commande web</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">Les commandes de votre boutique en ligne apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commandes.map((commande) => {
        const status = getStatusConfig(commande.statut);
        const StatusIcon = status.icon;
        const isPendingValidation = commande.statut === 'EN_ATTENTE_VALIDATION';

        return (
          <div key={commande.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">#{commande.id.slice(0, 8).toUpperCase()}</h3>
                      <BadgeComponent variant={status.color === 'green' ? 'success' : status.color === 'orange' ? 'warning' : status.color === 'blue' ? 'info' : 'neutral'} dot className={status.bg}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </BadgeComponent>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(commande.creeLe)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100" style={{ color: accentColor }}>{formatPrice(commande.total)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{commande.lignes.length} article(s)</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{commande.clientNom}</span>
                  {commande.clientTelephone && <span>{formatPhone(commande.clientTelephone)}</span>}
                </div>
                {commande.clientAdresse && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{commande.clientAdresse}</p>
                )}
              </div>

              {isPendingValidation && (
                <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Hourglass className="h-5 w-5" />
                      <span className="font-medium">Paiement déclaré par le client</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onValidate(commande.id)}
                      disabled={validatingId === commande.id}
                      loading={validatingId === commande.id}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Valider le paiement</span>
                    </Button>
                  </div>
                  {commande.referencePaiement && (
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      ID transaction: {commande.referencePaiement}
                    </p>
                  )}
                </div>
              )}

              {!isPendingValidation && commande.statut !== 'ANNULEE' && (
                <div className="mt-3 flex items-center gap-2">
                  {vendeur?.whatsapp && (
                    <a
                      href={`https://wa.me/${vendeur.whatsapp}?text=${encodeURIComponent(`Bonjour, concernant votre commande ${commande.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-lg font-medium text-sm transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => router.push(`/boutique/${user?.id}/commande/${commande.id}`)}>
                    <Eye className="h-4 w-4" />
                    <span>Voir détail</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
