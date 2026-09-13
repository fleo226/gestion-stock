'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Plus, Minus, Package, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Clock } from 'lucide-react';

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
    setFormError('');
    const quantite = parseInt(formData.quantite);
    const prixUnitaire = parseInt(formData.prixUnitaire);

    if (!quantite || quantite < 1) {
      setFormError('Quantite invalide');
      return;
    }

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'ENTREE' ? 'entree' : 'sortie',
          articleId: id,
          quantite,
          prixUnitaire,
          note: formData.note.trim() || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(null);
        setFormData({ quantite: '', prixUnitaire: '', note: '' });
        fetchArticle();
      } else {
        setFormError(data.error || 'Erreur');
      }
    } catch {
      setFormError('Erreur de connexion');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer definitivement cet article et son historique ?')) return;
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
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Chargement...</div></div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500">Article non trouve</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/stock" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
              <h1 className="text-xl font-bold text-gray-900">{article.nom}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/article/${id}/modifier`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Modifier"><Edit className="h-5 w-5" /></Link>
              <button onClick={handleDelete} className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg" title="Supprimer"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Article */}
        <div className="mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {article.photoUrl ? (
                <img src={article.photoUrl} alt={article.nom} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">{article.nom}</h2>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                {article.taille && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{article.taille}</span>}
                {article.couleur && <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">{article.couleur}</span>}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{article.unite}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cree le {formatDate(article.creeLe)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Prix d'achat</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(article.prixAchat)}</p>
              <p className="text-sm text-gray-500 mt-2">Prix de vente</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(article.prixVente)}</p>
              <p className="text-sm text-gray-500 mt-2">Benefice/un.</p>
              <p className="text-2xl font-bold text-purple-600">{formatPrice(article.prixVente - article.prixAchat)}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <Package className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-500 mt-1">Entrees totales</p>
            <p className="text-xl font-bold text-gray-900">{article.entreeTotal} {article.unite}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-500 mt-1">Vendus</p>
            <p className="text-xl font-bold text-gray-900">{article.vendu} {article.unite}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <Package className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-gray-500 mt-1">Stock actuel</p>
            <p className="text-xl font-bold text-gray-900">{article.quantite} {article.unite}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <p className="text-sm text-gray-500 mt-1">Valeur stock</p>
            <p className="text-xl font-bold text-gray-900">{formatPrice(article.valeurStock)}</p>
          </div>
        </div>

        {/* Actions Entree/Sortie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="flex items-center space-x-2 text-green-700 font-medium mb-4">
              <ArrowUpRight className="h-5 w-5" />
              <span>Entree de stock</span>
            </h3>
            {showForm === 'entree' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleMouvement('ENTREE'); }} className="space-y-3">
                {formError && <div className="text-sm text-red-600">{formError}</div>}
                <input type="number" min="1" placeholder="Quantite" value={formData.quantite} onChange={e => setFormData({...formData, quantite: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                <input type="number" min="0" placeholder="Prix unitaire (FCFA)" value={formData.prixUnitaire} onChange={e => setFormData({...formData, prixUnitaire: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Note (optionnel)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Valider</button>
                  <button type="button" onClick={() => { setShowForm(null); setFormData({quantite:'', prixUnitaire:'', note:''}); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowForm('entree')} className="w-full flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-3 rounded-lg hover:bg-green-100 font-medium">
                <Plus className="h-5 w-5" /><span>Enregistrer une entree</span>
              </button>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="flex items-center space-x-2 text-red-700 font-medium mb-4">
              <ArrowDownRight className="h-5 w-5" />
              <span>Sortie (vente)</span>
            </h3>
            {showForm === 'sortie' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleMouvement('SORTIE'); }} className="space-y-3">
                {formError && <div className="text-sm text-red-600">{formError}</div>}
                <input type="number" min="1" max={article.quantite} placeholder={`Quantite (max ${article.quantite})`} value={formData.quantite} onChange={e => setFormData({...formData, quantite: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                <input type="number" min="0" placeholder="Prix unitaire (FCFA)" value={formData.prixUnitaire} onChange={e => setFormData({...formData, prixUnitaire: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Note (optionnel)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Valider</button>
                  <button type="button" onClick={() => { setShowForm(null); setFormData({quantite:'', prixUnitaire:'', note:''}); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowForm('sortie')} className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 font-medium" disabled={article.quantite === 0}>
                <Minus className="h-5 w-5" /><span>Enregistrer une sortie</span>
              </button>
            )}
          </div>
        </div>

        {/* Historique */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Historique des mouvements</span>
            </h3>
          </div>
          {article.mouvements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun mouvement pour cet article</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {article.mouvements.map((m) => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${m.type === 'ENTREE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.type === 'ENTREE' ? 'Entree' : 'Sortie'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{m.quantite} {article.unite}</p>
                      <p className="text-sm text-gray-500">{formatPrice(m.prixUnitaire)} / {article.unite}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {m.note && <p className="text-sm text-gray-600 mb-1">{m.note}</p>}
                    <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
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