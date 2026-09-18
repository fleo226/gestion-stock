'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Package, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', nom: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/signin';
      const body = isSignup ? { ...formData } : { email: formData.email, password: formData.password };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-xl dark:shadow-gray-900/30 relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center">
          {isSignup ? 'Créer mon compte' : 'Bienvenue'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          {isSignup ? 'Rejoignez Ma Boutique pour gérer votre stock' : 'Connectez-vous pour accéder à votre boutique'}
        </p>

        {error && (
          <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm animate-pop flex items-center space-x-2">
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            </div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Prénom / Nom
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Ex: Aminata"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-13 py-3.5 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-900 dark:text-gray-100"
                placeholder="••••••••"
                required
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span>Connexion...</span>
              </span>
            ) : (isSignup ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'} 
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1"
          >
            {isSignup ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </p>
      </div>

      {/* Features below form */}
      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 relative z-10">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4 uppercase tracking-wide">Fonctionnalités</p>
        <div className="grid grid-cols-3 gap-4">
          <FeatureItem icon={<Package className="h-5 w-5" />} label="Stock" desc="Temps réel" />
          <FeatureItem icon={<TrendingUp className="h-5 w-5" />} label="Bénéfices" desc="Auto-calcul" />
          <FeatureItem icon={<DollarSign className="h-5 w-5" />} label="Prix" desc="Achat / Vente" />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
      <div className="mx-auto mb-2 p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">{icon}</div>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-xl dark:shadow-gray-900/30">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ma Boutique</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestion de stock simple & efficace</p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Vos données restent privées et sécurisées.
          </p>
        </div>
      </div>
    </div>
  );
}
