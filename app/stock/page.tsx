'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, Settings, Menu, X, TrendingUp, Package, DollarSign, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
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
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  const filteredArticles = articles.filter(a => 
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    (a.taille && a.taille.toLowerCase().includes(search.toLowerCase())) ||
    (a.couleur && a.couleur.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Ma Boutique</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Accueil</Link>
              <Link href="/stock" className="text-blue-600 font-medium">Mon Stock</Link>
              <Link href="/article/nouveau" className="text-gray-700 hover:text-blue-600 font-medium">+ Article</Link>
              <Link href="/activite" className="text-gray-700 hover:text-blue-600 font-medium">Activité</Link>
              <Link href="/parametres" className="text-gray-700 hover:text-blue-600 font-medium">Paramètres</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{user.nom}</span>
                </div>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <form action="/api/auth/logout" method="POST">
                <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-2">
                <Link href="/" className="px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Accueil</Link>
                <Link href="/stock" className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">Mon Stock</Link>
                <Link href="/article/nouveau" className="px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">+ Article</Link>
                <Link href="/activite" className="px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Activité</Link>
                <Link href="/parametres" className="px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Paramètres</Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user ? `Bienvenue, ${user.nom}!` : 'Mon Stock'}
              </h2>
              <p className="text-gray-600 mt-1">{articles.length} article(s) en stock</p>
            </div>
            <Link 
              href="/article/nouveau" 
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvel article</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-500 mt-1">Total articles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-500 mt-1">Valeur stock</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.valeurStock)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-500 mt-1">Bénéfices</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.benefice)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <ArrowUpRight className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-gray-500 mt-1">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.ca)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              <p className="text-sm text-gray-500 mt-1">Total vendu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVendu}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article</h3>
              <p className="text-gray-500 mb-6">{search ? 'Aucun résultat pour votre recherche' : 'Commencez par ajouter votre premier article'}</p>
              <Link 
                href="/article/nouveau" 
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un article</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/article/${article.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {article.photoUrl ? (
                        <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{article.nom}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                        {article.taille && <span>Taille: {article.taille}</span>}
                        {article.couleur && <span>• {article.couleur}</span>}
                      </div>
                      <div className="flex items-center space-x-3 text-sm mt-1">
                        <span className="text-gray-500">Stock: <span className="font-medium text-gray-900">{article.quantite} {article.unite}</span></span>
                        <span className="text-green-600 font-medium">{formatPrice(article.prixVente)}</span>
                        <span className="text-gray-400 line-through">{formatPrice(article.prixAchat)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Bénéfice</p>
                      <p className="font-medium text-purple-600">{formatPrice(article.benefice)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}