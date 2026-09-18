'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Clock, Package } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

type Mouvement = {
  id: string;
  type: string;
  quantite: number;
  prixUnitaire: number;
  date: string;
  note: string | null;
  article: { nom: string; unite: string };
};

export default function ActivitePage() {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ENTREE' | 'SORTIE'>('all');

  useEffect(() => {
    fetch('/api/stock')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const all: Mouvement[] = [];
          data.data.forEach((article: any) => {
            article.mouvements?.forEach((m: any) => {
              all.push({ ...m, article: { nom: article.nom, unite: article.unite } });
            });
          });
          all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setMouvements(all);
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = filter === 'all' ? mouvements : mouvements.filter(m => m.type === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center space-x-2 h-14">
            <Link href="/stock" className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700 rounded-xl touch-manipulation">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activité</h1>
            <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">({mouvements.length})</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Filter Pills */}
        <div className="flex space-x-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <FilterPill
            label="Tout"
            count={mouvements.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            color="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            activeColor="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
          />
          <FilterPill
            label="Entrées"
            count={mouvements.filter(m => m.type === 'ENTREE').length}
            active={filter === 'ENTREE'}
            onClick={() => setFilter('ENTREE')}
            color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            activeColor="bg-emerald-600 text-white"
          />
          <FilterPill
            label="Sorties"
            count={mouvements.filter(m => m.type === 'SORTIE').length}
            active={filter === 'SORTIE'}
            onClick={() => setFilter('SORTIE')}
            color="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            activeColor="bg-red-600 text-white"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun mouvement</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {filter === 'all' ? 'Les entrées et sorties apparaîtront ici' : `Aucune ${filter === 'ENTREE' ? 'entrée' : 'sortie'} enregistrée`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 active:bg-gray-50 dark:active:bg-gray-700 touch-manipulation transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      m.type === 'ENTREE' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'
                    }`}>
                      {m.type === 'ENTREE' ? (
                        <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{m.article.nom}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite} {m.article.unite}
                        {m.note && <span className="text-gray-400 dark:text-gray-500"> · {m.note}</span>}
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
              </div>
            ))}
          </div>
        )}
      </main>
    <AIAssistant />
    </div>
  );
}

function FilterPill({ label, count, active, onClick, color, activeColor }: {
  label: string; count: number; active: boolean; onClick: () => void; color: string; activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 touch-manipulation transition-all ${
        active ? activeColor : color
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-white dark:bg-gray-600'}`}>{count}</span>
    </button>
  );
}
