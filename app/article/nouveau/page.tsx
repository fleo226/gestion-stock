'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package } from 'lucide-react';

const UNITES = ['piece', 'paire', 'metre', 'kg', 'lot', 'sachet'];

export default function NouvelArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    taille: '',
    couleur: '',
    prixAchat: '',
    prixVente: '',
    quantite: '0',
    unite: 'piece',
    photoUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          nom: formData.nom.trim(),
          taille: formData.taille.trim() || null,
          couleur: formData.couleur.trim() || null,
          prixAchat: parseInt(formData.prixAchat) || 0,
          prixVente: parseInt(formData.prixVente) || 0,
          quantite: parseInt(formData.quantite) || 0,
          unite: formData.unite,
          photoUrl: formData.photoUrl.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la creation');
        return;
      }

      router.push('/stock');
      router.refresh();
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/stock" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Nouvel article</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optionnel)</label>
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Apercu" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    <Package className="h-8 w-8 text-gray-400 mx-auto" />
                    <span className="text-xs text-gray-500">Ajouter une photo</span>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="URL de l'image (optionnel)"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            {/* Nom */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'article <span className="text-red-500">*</span>
              </label>
              <input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: Robe traditionnelle"
                required
              />
            </div>

            {/* Taille & Couleur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="taille" className="block text-sm font-medium text-gray-700 mb-1">
                  Taille
                </label>
                <input
                  id="taille"
                  type="text"
                  value={formData.taille}
                  onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex: M, XL, 42"
                />
              </div>
              <div>
                <label htmlFor="couleur" className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  id="couleur"
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex: rouge, bleu"
                />
              </div>
            </div>

            {/* Prix */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prixAchat" className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat (FCFA)
                </label>
                <input
                  id="prixAchat"
                  type="number"
                  min="0"
                  value={formData.prixAchat}
                  onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="prixVente" className="block text-sm font-medium text-gray-700 mb-1">
                  Prix de vente (FCFA)
                </label>
                <input
                  id="prixVente"
                  type="number"
                  min="0"
                  value={formData.prixVente}
                  onChange={(e) => setFormData({ ...formData, prixVente: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quantite & Unite */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantite initiale
                </label>
                <input
                  id="quantite"
                  type="number"
                  min="0"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="unite" className="block text-sm font-medium text-gray-700 mb-1">
                  Unite
                </label>
                <select
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  {UNITES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bénéfice estimé */}
            {formData.prixAchat && formData.prixVente && parseInt(formData.prixVente) > parseInt(formData.prixAchat) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Benefice estime par unite : <span className="font-bold">{(parseInt(formData.prixVente) - parseInt(formData.prixAchat)).toLocaleString()} FCFA</span>
                </p>
                <p className="text-sm text-green-600">
                  Marge : {Math.round(((parseInt(formData.prixVente) - parseInt(formData.prixAchat)) / parseInt(formData.prixAchat)) * 100)}%
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Link
                href="/stock"
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}