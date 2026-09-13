'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Palette, LogOut } from 'lucide-react';

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
        setMessage('Parametres sauvegardes !');
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

  const COULEURS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#4338ca'];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 h-16">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-xl font-bold text-gray-900">Parametres</h1>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        {/* Profil */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4">
            <User className="h-5 w-5" />
            <span>Mon profil</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Couleur */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4">
            <Palette className="h-5 w-5" />
            <span>Couleur du theme</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {COULEURS.map(c => (
              <button
                key={c}
                onClick={() => setCouleur(c)}
                className={`w-12 h-12 rounded-full border-2 transition-all ${couleur === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <label className="text-sm text-gray-600">Personnaliser :</label>
            <input type="color" value={couleur} onChange={e => setCouleur(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
            <span className="text-sm font-mono text-gray-500">{couleur}</span>
          </div>
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${couleur}10` }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: couleur }} />
              <div>
                <p className="font-medium" style={{ color: couleur }}>Apercu</p>
                <p className="text-sm text-gray-500">Voici a quoi ressemblera votre theme</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex items-center justify-between">
            <button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              <Save className="h-5 w-5" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
            <button onClick={handleLogout} className="flex items-center space-x-2 px-6 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium">
              <LogOut className="h-5 w-5" />
              <span>Deconnexion</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}