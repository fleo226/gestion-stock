'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Package, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { fcfa } from '@/lib/format';

type Mouvement = {
  id: string;
  type: string;
  quantite: number;
  prixUnitaire: number;
  date: string;
  note: string | null;
  article: { id: string; nom: string; unite: string; prixAchat: number; prixVente: number };
};

type Article = {
  id: string;
  nom: string;
  categorieId: string | null;
  categorie: { id: string; nom: string; couleur: string } | null;
  prixAchat: number;
  prixVente: number;
  quantite: number;
  unite: string;
};

export default function StatsPage() {
  const router = useRouter();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [moisActuel, setMoisActuel] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'ENTREE' | 'SORTIE'>('all');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stock')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setArticles(data.data);
          const all: Mouvement[] = [];
          data.data.forEach((article: any) => {
            article.mouvements?.forEach((m: any) => {
              all.push({ ...m, article: { id: article.id, nom: article.nom, unite: article.unite, prixAchat: article.prixAchat, prixVente: article.prixVente } });
            });
          });
          all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setMouvements(all);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtrer par mois
  const debutMois = new Date(moisActuel.getFullYear(), moisActuel.getMonth(), 1);
  const finMois = new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 0, 23, 59, 59);

  const mvtDuMois = filter === 'all' 
    ? mouvements.filter(m => new Date(m.date) >= debutMois && new Date(m.date) <= finMois)
    : mouvements.filter(m => m.type === filter && new Date(m.date) >= debutMois && new Date(m.date) <= finMois);

  // Stats du mois
  const entrees = mvtDuMois.filter(m => m.type === 'ENTREE');
  const sorties = mvtDuMois.filter(m => m.type === 'SORTIE');

  const totalEntrees = entrees.reduce((s, m) => s + m.quantite * m.prixUnitaire, 0);
  const totalSorties = sorties.reduce((s, m) => s + m.quantite * m.prixUnitaire, 0);
  const ca = totalSorties;
  const achats = totalEntrees;
  const benefice = ca - achats;
  const nbVentes = sorties.length;
  const nbArticlesVendus = sorties.reduce((s, m) => s + m.quantite, 0);

  // Top articles du mois
  const ventesParArticle: Record<string, { nom: string; unite: string; quantite: number; ca: number; benefice: number }> = {};
  sorties.forEach(m => {
    if (!ventesParArticle[m.article.id]) {
      ventesParArticle[m.article.id] = { nom: m.article.nom, unite: m.article.unite, quantite: 0, ca: 0, benefice: 0 };
    }
    ventesParArticle[m.article.id].quantite += m.quantite;
    ventesParArticle[m.article.id].ca += m.quantite * m.prixUnitaire;
    ventesParArticle[m.article.id].benefice += m.quantite * (m.prixUnitaire - m.article.prixAchat);
  });

  const topArticles = Object.values(ventesParArticle)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5);

  // Projections
  const joursPasses = new Date().getDate();
  const joursDansMois = new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 0).getDate();
  const joursRestants = joursDansMois - joursPasses;
  const moyCaParJour = nbVentes > 0 ? ca / joursPasses : 0;
  const projCa = Math.round(moyCaParJour * joursDansMois);
  const projBenefice = Math.round((benefice / (ca || 1)) * projCa);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "à l'instant";
    if (hours < 24) return `il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(p);

  const moisLabel = moisActuel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handleExport = () => {
    const headers = ['Nom', 'Catégorie', 'Quantité', 'Prix Achat (FCFA)', 'Prix Vente (FCFA)', 'Valeur Stock (FCFA)'];
    const rows = articles.map(a => [
      a.nom,
      a.categorie?.nom || '',
      String(a.quantite),
      String(a.prixAchat),
      String(a.prixVente),
      String(a.quantite * a.prixAchat),
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <Link href="/stock" className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl touch-manipulation">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Journal & Stats</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => setMoisActuel(new Date(moisActuel.getFullYear(), moisActuel.getMonth() - 1, 1))} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl touch-manipulation">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize px-2">{moisLabel}</span>
              <button onClick={() => setMoisActuel(new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 1))} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl touch-manipulation">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* KPIs du mois */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<ArrowUpRight className="h-5 w-5" />} label="Achats" value={formatPrice(achats)} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-900/30" />
          <StatCard icon={<ArrowDownRight className="h-5 w-5" />} label="CA" value={formatPrice(ca)} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/30" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Bénéfice" value={formatPrice(benefice)} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
          <StatCard icon={<Package className="h-5 w-5" />} label="Vendus" value={`${nbArticlesVendus}`} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/30" />
        </div>

        {/* Projections */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Projection fin de mois</h3>
            <Calendar className="h-5 w-5" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/70 text-xs">Jours restants</p>
              <p className="text-xl font-bold">{joursRestants}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/70 text-xs">CA projeté</p>
              <p className="text-lg font-bold">{formatPrice(projCa)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/70 text-xs">Bénéfice projeté</p>
              <p className="text-lg font-bold">{formatPrice(projBenefice)}</p>
            </div>
          </div>
        </div>

        {/* Top Articles */}
        {topArticles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span>Top 5 du mois</span>
              </h3>
            </div>
            <div className="space-y-2">
              {topArticles.map((a, i) => (
                <div key={a.nom} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, #7c3aed, #2563eb)` }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{a.nom}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{a.quantite} {a.unite} • {formatPrice(a.ca)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatPrice(a.benefice)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">bénéfice</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <FilterButton label="Tout" count={mvtDuMois.length} active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterButton label="Entrées" count={entrees.length} active={filter === 'ENTREE'} onClick={() => setFilter('ENTREE')} color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" activeColor="bg-emerald-600 text-white" />
            <FilterButton label="Sorties" count={sorties.length} active={filter === 'SORTIE'} onClick={() => setFilter('SORTIE')} color="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" activeColor="bg-red-600 text-white" />
          </div>
          <button onClick={handleExport} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gray-600 touch-manipulation">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Liste des mouvements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : mvtDuMois.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>Aucun mouvement ce mois-ci</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {mvtDuMois.slice(0, 50).map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.type === 'ENTREE' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                      {m.type === 'ENTREE' ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{m.article.nom}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite} {m.article.unite}
                        <span className="text-gray-400 dark:text-gray-500">·</span>
                        <span>{formatPrice(m.prixUnitaire)}</span>
                        {m.note && <span className="text-gray-400 dark:text-gray-500">·</span>}
                        {m.note && <span className="truncate max-w-[150px]">{m.note}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${m.type === 'ENTREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {m.type === 'ENTREE' ? '+' : '-'}{formatPrice(m.quantite * m.prixUnitaire)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(m.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-xl ${bg}`}>
      <div className={`${color} mb-1`}>{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FilterButton({ label, count, active, onClick, color, activeColor }: { label: string; count: number; active: boolean; onClick: () => void; color?: string; activeColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 touch-manipulation transition-all ${
        active ? (activeColor || 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900') : (color || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300')
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-white dark:bg-gray-600'}`}>{count}</span>
    </button>
  );
}
