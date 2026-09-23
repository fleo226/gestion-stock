'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package, Camera, Trash2, Loader2 } from 'lucide-react';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, photoUrl: url });
    if (url) setPreviewUrl(url);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Configuration Supabase manquante.');
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erreur upload Supabase:', uploadError);
        setError(`Erreur upload: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      setFormData({ ...formData, photoUrl: publicUrl });
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

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

  const removeImage = () => {
    setPreviewUrl(null);
    setFormData({ ...formData, photoUrl: '' });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    if (e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/stock" className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg touch-manipulation">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Nouvel article</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <fieldset className="space-y-3">
              <legend className="block text-sm font-medium text-gray-700">Photo de l'article</legend>
              
              <div className="relative">
                <div
                  className={`w-full aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors touch-manipulation relative overflow-hidden ${
                    previewUrl ? 'border-transparent' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors touch-manipulation z-10"
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      {uploading ? (
                        <>
                          <div className="mx-auto mb-2 p-3 bg-blue-50 rounded-xl">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                          </div>
                          <p className="text-sm text-blue-600">Upload en cours...</p>
                        </>
                      ) : (
                        <>
                          <div className="mx-auto mb-2 p-3 bg-gray-100 rounded-xl">
                            <Camera className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600">Touchez pour ajouter une photo</p>
                          <p className="text-xs text-gray-400 mt-1">Upload direct Supabase</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!previewUrl && !uploading && (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Choisir une photo"
                  />
                )}

                <div className="mt-3">
                  <input
                    type="url"
                    value={formData.photoUrl.startsWith('data:') ? '' : formData.photoUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={!!previewUrl && !formData.photoUrl.startsWith('http')}
                  />
                  {previewUrl && formData.photoUrl.startsWith('https://') && (
                    <p className="text-xs text-green-600 mt-1">Photo ajoutée depuis Supabase Storage</p>
                  )}
                </div>
              </div>
            </fieldset>

            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom de l'article <span className="text-red-500">*</span>
              </label>
              <input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: Robe traditionnelle"
                required
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="taille" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Taille
                </label>
                <input
                  id="taille"
                  type="text"
                  value={formData.taille}
                  onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex: M, XL, 42"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="couleur" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Couleur
                </label>
                <input
                  id="couleur"
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex: rouge, bleu"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prixAchat" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prix d'achat (FCFA)
                </label>
                <input
                  id="prixAchat"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formData.prixAchat}
                  onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="prixVente" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prix de vente (FCFA)
                </label>
                <input
                  id="prixVente"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formData.prixVente}
                  onChange={(e) => setFormData({ ...formData, prixVente: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantité initiale
                </label>
                <input
                  id="quantite"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="unite" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Unité
                </label>
                <select
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none"
                >
                  {UNITES.map(u => (
                    <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.prixAchat && formData.prixVente && parseInt(formData.prixVente) > parseInt(formData.prixAchat) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center space-x-2 text-green-700 mb-1">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Bénéfice estimé par unité</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {(parseInt(formData.prixVente) - parseInt(formData.prixAchat)).toLocaleString()} FCFA
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Marge : {Math.round(((parseInt(formData.prixVente) - parseInt(formData.prixAchat)) / parseInt(formData.prixAchat)) * 100)}%
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
              <Link
                href="/stock"
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium text-base touch-manipulation active:bg-gray-300"
              >
                <span>Annuler</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-base touch-manipulation active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
