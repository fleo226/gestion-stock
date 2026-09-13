'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package } from 'lucide-react';

const UNITES = ['piece', 'paire', 'metre', 'kg', 'lot', 'sachet'];

export default function ModifierArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nom: '', taille: '', couleur: '', prixAchat: '', prixVente: '', unite: 'piece', photoUrl: ''
  });

  useEffect(() => {
    fetch(`/api/stock?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const a = data.data;
          setFormData({
            nom: a.nom, taille: a.taille || '', couleur: a.couleur || '', prixAchat: String(a.prixAchat), prixVente: String(a.prixVente), unite: a.unite, photoUrl: a.photoUrl || ''
          });
        } else { setError('Article introuvable'); }
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update', id, nom: formData.nom.trim(), taille: formData.taille.trim() || null, couleur: formData.couleur.trim() || null, prixAchat: parseInt(formData.prixAchat) || 0, prixVente: parseInt(formData.prixVente) || 0, unite: formData.unite, photoUrl: formData.photoUrl.trim() || null
        })
      });
      const data = await res.json();
      if (data.success) router.push(`/article/${id}`);
      else setError(data.error || 'Erreur');
    } catch { setError('Erreur de connexion'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 h-16">
            <Link href={`/article/${id}`} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-xl font-bold text-gray-900">Modifier l'article</h1>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
                <input type="text" value={formData.taille} onChange={e => setFormData({...formData, taille: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input type="text" value={formData.couleur} onChange={e => setFormData({...formData, couleur: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (FCFA)</label>
                <input type="number" min="0" value={formData.prixAchat} onChange={e => setFormData({...formData, prixAchat: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (FCFA)</label>
                <input type="number" min="0" value={formData.prixVente} onChange={e => setFormData({...formData, prixVente: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unite</label>
              <select value={formData.unite} onChange={e => setFormData({...formData, unite: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo (URL)</label>
              <input type="url" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
            </div>
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Link href={`/article/${id}`} className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Annuler</Link>
              <button type="submit" disabled={saving} className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" /><span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}