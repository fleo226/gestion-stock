'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Clock, Package } from 'lucide-react';

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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatPrice = (p: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(p);

  const filtered = filter === 'all' ? mouvements : mouvements.filter(m => m.type === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 h-16">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-xl font-bold text-gray-900">Activite</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="flex space-x-2 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>Tout ({mouvements.length})</button>
          <button onClick={() => setFilter('ENTREE')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'ENTREE' ? 'bg-green-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>Entrees ({mouvements.filter(m => m.type === 'ENTREE').length})</button>
          <button onClick={() => setFilter('SORTIE')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'SORTIE' ? 'bg-red-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>Sorties ({mouvements.filter(m => m.type === 'SORTIE').length})</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun mouvement enregistre</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border divide-y divide-gray-200">
            {filtered.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${m.type === 'ENTREE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {m.type === 'ENTREE' ? <ArrowUpRight className="inline h-4 w-4" /> : <ArrowDownRight className="inline h-4 w-4" />}
                    {' '}{m.type === 'ENTREE' ? 'Entree' : 'Sortie'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{m.article.nom}</p>
                    <p className="text-sm text-gray-500">{m.quantite} {m.article.unite} a {formatPrice(m.prixUnitaire)}</p>
                    {m.note && <p className="text-xs text-gray-400 mt-1">{m.note}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${m.type === 'ENTREE' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'ENTREE' ? '+' : '-'}{formatPrice(m.quantite * m.prixUnitaire)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}