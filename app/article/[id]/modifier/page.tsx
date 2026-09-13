'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package, Camera, Trash2, Image, Loader2 } from 'lucide-react';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, photoUrl: url });
    if (url) setPreviewUrl(url);
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setFormData({ ...formData, photoUrl: base64 });
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    setFormData({ ...formData, photoUrl: '' });
  };

  useEffect(() => {
    fetch(`/api/stock?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const a = data.data;
          setFormData({
            nom: a.nom, taille: a.taille || '', couleur: a.couleur || '', prixAchat: String(a.prixAchat), prixVente: String(a.prixVente), unite: a.unite, photoUrl: a.photoUrl || ''
          });
          if (a.photoUrl) setPreviewUrl(a.photoUrl);
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center space-x-2 h-14">
            <Link href={`/article/${id}`} className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-xl touch-manipulation">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Modifier</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-pop">
              {error}
            </div>
          )}

          {/* Photo */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-medium text-gray-700">Photo</legend>
            <div className="relative">
              <div className="w-full aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors touch-manipulation" style={{ backgroundColor: previewUrl ? 'transparent' : undefined }}>
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 touch-manipulation">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                )}
              </div>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={e => handleImageUrlChange(e.target.value)}
                placeholder="https://... (optionnel)"
                className="mt-3 w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!!previewUrl && !formData.photoUrl.startsWith('http')}
              />
              {previewUrl && !formData.photoUrl.startsWith('http') && (
                <p className="text-xs text-green-600 mt-1">Photo depuis l'appareil</p>
              )}
            </div>
          </fieldset>

          {/* Nom */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
            <input id="nom" type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>

          {/* Taille & Couleur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Taille</label>
              <input type="text" value={formData.taille} onChange={e => setFormData({...formData, taille: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: M, XL, 42" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
              <input type="text" value={formData.couleur} onChange={e => setFormData({...formData, couleur: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: rouge, bleu" />
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix d'achat (FCFA)</label>
              <input type="number" min="0" inputMode="numeric" value={formData.prixAchat} onChange={e => setFormData({...formData, prixAchat: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix de vente (FCFA)</label>
              <input type="number" min="0" inputMode="numeric" value={formData.prixVente} onChange={e => setFormData({...formData, prixVente: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
            </div>
          </div>

          {/* Unite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unité</label>
            <select value={formData.unite} onChange={e => setFormData({...formData, unite: e.target.value})} className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none">
              {UNITES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
            </select>
          </div>

          {/* Bénéfice estimé */}
          {formData.prixAchat && formData.prixVente && parseInt(formData.prixVente) > parseInt(formData.prixAchat) && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <p className="text-2xl font-bold text-green-700">{(parseInt(formData.prixVente) - parseInt(formData.prixAchat)).toLocaleString()} FCFA</p>
              <p className="text-sm text-green-600 mt-1">Marge : {Math.round(((parseInt(formData.prixVente) - parseInt(formData.prixAchat)) / parseInt(formData.prixAchat)) * 100)}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2 border-t border-gray-100">
            <Link href={`/article/${id}`} className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium active:bg-gray-200 touch-manipulation">
              <span>Annuler</span>
            </Link>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-800 touch-manipulation disabled:opacity-50">
              <Save className="h-5 w-5" />
              <span>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}