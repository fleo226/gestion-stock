'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, Menu, X, TrendingUp, Package, DollarSign, ArrowUpRight, ArrowDownRight, Search, ChevronRight, User, Settings, Activity } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

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
};

export default function StockPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ totalArticles: 0, valeurStock: 0, benefice: 0, ca: 0, totalVendu: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState<{nom: string, couleur: string} | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchUser(); }, []);

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

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  const filteredArticles = articles.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    (a.taille && a.taille.toLowerCase().includes(search.toLowerCase())) ||
    (a.couleur && a.couleur.toLowerCase().includes(search.toLowerCase()))
  );

  const accentColor = user?.couleur || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Compact Mobile */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">Ma Boutique</h1>
                <p className="text-xs text-gray-500">{stats.totalArticles} articles</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/parametres"
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl active:bg-gray-200 touch-manipulation transition-colors"
                title="Paramètres"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl active:bg-red-100 touch-manipulation transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Welcome Card */}
        {user && (
          <div className="mb-5 p-4 rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
            <p className="text-sm text-white/80">Bienvenue,</p>
            <h2 className="text-xl font-bold text-white">{user.nom}</h2>
            <div className="mt-3 flex items-center space-x-4">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg">
                <p className="text-xs text-white/80">Valeur stock</p>
                <p className="text-base font-bold text-white">{formatPrice(stats.valeurStock)}</p>
              </div>
              <div className="bg-white/20 px-3 py-1.5 rounded-lg">
                <p className="text-xs text-white/80">Bénéfice</p>
                <p className="text-base font-bold text-white">{formatPrice(stats.benefice)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
          <StatPill icon={<Package className="h-4 w-4" />} label="Articles" value={String(stats.totalArticles)} color="text-blue-600" bg="bg-blue-50" />
          <StatPill icon={<DollarSign className="h-4 w-4" />} label="Stock" value={formatPrice(stats.valeurStock)} color="text-emerald-600" bg="bg-emerald-50" />
          <StatPill icon={<TrendingUp className="h-4 w-4" />} label="Vendus" value={String(stats.totalVendu)} color="text-purple-600" bg="bg-purple-50" />
          <StatPill icon={<ArrowUpRight className="h-4 w-4" />} label="CA" value={formatPrice(stats.ca)} color="text-orange-600" bg="bg-orange-50" />
        </div>

        {/* Search + Add */}
        <div className="flex space-x-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <Link
            href="/article/nouveau"
            className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg active:shadow-md transition-shadow touch-manipulation"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {search ? 'Aucun résultat' : 'Aucun article'}
            </h3>
            <p className="text-gray-500 mb-5 text-sm">
              {search ? 'Essayez une autre recherche' : 'Ajoutez votre premier article pour commencer'}
            </p>
            {!search && (
              <Link
                href="/article/nouveau"
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl text-base font-medium touch-manipulation"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un article</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors">
                <Link href={`/article/${article.id}`} className="block p-4">
                  <div className="flex items-center space-x-3">
                    {/* Photo / Avatar */}
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {article.photoUrl ? (
                        <img
                          src={article.photoUrl}
                          alt={article.nom}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-300">{article.nom.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{article.nom}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {article.taille && <span>{article.taille}</span>}
                        {article.taille && article.couleur && <span>·</span>}
                        {article.couleur && <span>{article.couleur}</span>}
                        <span>·</span>
                        <span className="font-medium" style={{ color: article.quantite > 0 ? accentColor : '#ef4444' }}>
                          {article.quantite} {article.unite}
                        </span>
                      </div>
                    </div>

                    {/* Price & Profit */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">{formatPrice(article.prixVente)}</p>
                      {article.vendu > 0 && (
                        <p className="text-xs text-green-600">+{formatPrice(article.benefice)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/article/nouveau"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:shadow-lg transition-all touch-manipulation z-40"
        style={{ backgroundColor: accentColor }}
      >
        <Plus className="h-6 w-6" />
      </Link>
    <AIAssistant />
    </div>
  );
}

function StatPill({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${bg} flex-shrink-0`}>
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}