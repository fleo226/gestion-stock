'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Plus, Minus, Package, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, X, Check, Loader2 } from 'lucide-react';
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
  categorieId: string | null;
  categorie: { id: string; nom: string; couleur: string } | null;
  mouvements: {
    id: string;
    type: string;
    quantite: number;
    prixUnitaire: number;
    date: string;
    note: string | null;
  }[];
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<'entree' | 'sortie' | null>(null);
  const [formData, setFormData] = useState({ quantite: '', prixUnitaire: '', note: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/stock?id=${id}`);
      const data = await res.json();
      if (data.success) setArticle(data.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticle(); }, [id]);

  const handleMouvement = async (type: 'ENTREE' | 'SORTIE') => {
    const quantite = parseInt(formData.quantite);
    const prixUnitaire = parseInt(formData.prixUnitaire);
    if (!quantite || quantite < 1) { setFormError('Quantité invalide'); return; }
    if (!prixUnitaire || prixUnitaire < 0) { setFormError('Prix invalide'); return; }
    if (type === 'SORTIE' && article && quantite > article.quantite) { setFormError('Stock insuffisant'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'ENTREE' ? 'entree' : 'sortie',
          articleId: id,
          quantite,
          prixUnitaire,
          note: formData.note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(null);
        fetchArticle();
      } else {
        setFormError(data.error || 'Erreur');
      }
    } catch {
      setFormError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet article et tout son historique ?')) return;
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) router.push('/stock');
      else alert(data.error || 'Erreur');
    } catch { alert('Erreur de connexion'); }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );
  if (!article) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Article non trouvé</p>
        <Link href="/stock" className="text-blue-600 dark:text-blue-400 text-sm mt-2 inline-block">Retour au stock</Link>
      </div>
    </div>
  );

  const marge = article.prixVente - article.prixAchat;
  const pourcentageMarge = article.prixAchat > 0 ? Math.round((marge / article.prixAchat) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <Link href="/stock" className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700 rounded-xl touch-manipulation">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{article.nom}</h1>
            </div>
            <div className="flex items-center space-x-1">
              <Link href={`/article/${id}/modifier`} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl active:bg-blue-100 touch-manipulation">
                <Edit className="h-5 w-5" />
              </Link>
              <button onClick={handleDelete} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl active:bg-red-100 touch-manipulation">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-5">
          <div className="flex items-center p-4 space-x-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {article.photoUrl ? (
                <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-200 dark:text-gray-600">{article.nom.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{article.nom}</h2>
              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                {article.categorie && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium text-white" style={{ backgroundColor: article.categorie.couleur }}>{article.categorie.nom}</span>
                )}
                {article.taille && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">{article.taille}</span>}
                {article.couleur && <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">{article.couleur}</span>}
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs">{article.unite}</span>
              </div>
            </div>
          </div>

          {/* Prix & Marge */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 border-t border-gray-100 dark:border-gray-700">
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Achat</p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatPrice(article.prixAchat)}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Vente</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">{formatPrice(article.prixVente)}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Marge</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatPrice(marge)}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">+{pourcentageMarge}%</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard icon={<Package className="h-5 w-5" />} label="Entrées totales" value={`${article.entreeTotal}`} unit={article.unite} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Vendus" value={`${article.vendu}`} unit={article.unite} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/30" />
          <StatCard icon={<Package className="h-5 w-5" />} label="Stock actuel" value={`${article.quantite}`} unit={article.unite} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/30" />
          <StatCard icon={<DollarSign className="h-5 w-5" />} label="Bénéfices" value={formatPrice(article.benefice)} unit="" color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/30" />
        </div>

        {/* Actions Entree / Sortie */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => { setShowForm('entree'); setFormError(''); setFormData({quantite:'', prixUnitaire: String(article.prixAchat), note:''}); }}
            className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 py-4 rounded-xl font-medium active:bg-emerald-100 dark:active:bg-emerald-900/50 touch-manipulation transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <ArrowUpRight className="h-5 w-5" />
              <span>Entrée</span>
            </div>
          </button>
          <button
            onClick={() => { setShowForm('sortie'); setFormError(''); setFormData({quantite:'', prixUnitaire: String(article.prixVente), note:''}); }}
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 py-4 rounded-xl font-medium active:bg-red-100 dark:active:bg-red-900/50 touch-manipulation transition-colors disabled:opacity-50"
            disabled={article.quantite === 0}
          >
            <div className="flex items-center justify-center space-x-2">
              <ArrowDownRight className="h-5 w-5" />
              <span>Sortie</span>
            </div>
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowForm(null)}>
            <div
              className="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {showForm === 'entree' ? 'Entrée de stock' : 'Sortie (vente)'}
                </h3>
                <button onClick={() => setShowForm(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl touch-manipulation">
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleMouvement(showForm === 'entree' ? 'ENTREE' : 'SORTIE'); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    max={showForm === 'sortie' ? article.quantite : undefined}
                    inputMode="numeric"
                    value={formData.quantite}
                    onChange={(e) => setFormData({...formData, quantite: e.target.value})}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                    placeholder={`Ex: ${showForm === 'sortie' ? `max ${article.quantite}` : '5'}`}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({...formData, prixUnitaire: e.target.value})}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note (optionnel)</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Ex: Vente au client Amadou"
                  />
                </div>

                {/* Calcul preview */}
                {formData.quantite && formData.prixUnitaire && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                    Total : <span className="font-bold text-gray-900 dark:text-gray-100">
                      {(parseInt(formData.quantite) * parseInt(formData.prixUnitaire)).toLocaleString()} FCFA
                    </span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(null)}
                    className="flex-1 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 text-white rounded-xl font-medium active:bg-opacity-90 touch-manipulation disabled:opacity-50 flex items-center justify-center space-x-2"
                    style={{ backgroundColor: showForm === 'entree' ? '#059669' : '#dc2626' }}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Valider</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Historique */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Historique</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">({article.mouvements.length})</span>
          </div>

          {article.mouvements.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun mouvement</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {article.mouvements.map((m) => (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700 touch-manipulation">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'ENTREE' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                      {m.type === 'ENTREE' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite} {article.unite}
                      </p>
                      {m.note && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{m.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(m.prixUnitaire)}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(m.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    <AIAssistant />
    </div>
  );
}

function StatCard({ icon, label, value, unit, color, bg }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string; bg: string }) {
  return (
    <div className={`p-3 rounded-xl ${bg}`}>
      <div className={`${color} mb-1`}>{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
