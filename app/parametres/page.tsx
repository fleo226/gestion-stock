'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Palette, LogOut, Shield, Loader2, Check } from 'lucide-react';

export default function ParametresPage() {
  const router = useRouter();
  const [user, setUser] = useState<{id: string; email: string; nom: string; couleur: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nom, setNom] = useState('');
  const [couleur, setCouleur] = useState('#2563eb');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setNom(data.user.nom);
          setCouleur(data.user.couleur || '#2563eb');
        } else {
          router.push('/auth/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', nom: nom.trim(), couleur })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Paramètres sauvegardés !');
        setUser(prev => prev ? { ...prev, nom: nom.trim(), couleur } : prev);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Erreur');
      }
    } catch {
      setMessage('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const COULEURS = [
    { value: '#2563eb', label: 'Bleu' },
    { value: '#7c3aed', label: 'Violet' },
    { value: '#059669', label: 'Vert' },
    { value: '#d97706', label: 'Orange' },
    { value: '#dc2626', label: 'Rouge' },
    { value: '#0891b2', label: 'Cyan' },
    { value: '#be185d', label: 'Rose' },
    { value: '#4338ca', label: 'Indigo' },
    { value: '#9333ea', label: 'Mauve' },
    { value: '#ea580c', label: 'Orange foncé' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <Link href="/stock" className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-xl touch-manipulation">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Paramètres</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 text-white rounded-xl text-sm font-medium active:bg-blue-800 touch-manipulation disabled:opacity-50"
              style={{ backgroundColor: couleur }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center space-x-2 animate-pop ${
            message.includes('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.includes('Erreur') ? null : <Check className="h-5 w-5" />}
            <span>{message}</span>
          </div>
        )}

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: couleur }}>
              {nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mon profil</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom affiché</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Votre nom"
              />
            </div>
          </div>
        </div>

        {/* Couleur du thème */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center space-x-2 mb-5">
            <Palette className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Couleur du thème</h3>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-5">
            {COULEURS.map(c => (
              <button
                key={c.value}
                onClick={() => setCouleur(c.value)}
                className={`aspect-square rounded-xl transition-all touch-manipulation relative ${
                  couleur === c.value ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
              >
                {couleur === c.value && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm text-gray-600 flex-shrink-0">Personnalisée :</label>
            <input
              type="color"
              value={couleur}
              onChange={e => setCouleur(e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer touch-manipulation"
            />
            <span className="text-sm font-mono text-gray-500">{couleur}</span>
          </div>

          {/* Aperçu */}
          <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: `${couleur}30`, backgroundColor: `${couleur}08` }}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: couleur }}>
                {nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: couleur }}>{nom || 'Votre nom'}</p>
                <p className="text-sm text-gray-500">Aperçu du thème</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Sécurité</h3>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium active:bg-red-100 touch-manipulation transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </main>
    </div>
  );
}