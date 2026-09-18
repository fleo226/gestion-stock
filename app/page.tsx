'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, TrendingUp, DollarSign, ArrowRight, CheckCircle, Users, Smartphone, Shield, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) router.push('/stock');
      });
  }, [router]);

  const features = [
    { icon: <Package className="h-6 w-6" />, title: 'Stock temps réel', desc: 'Suivez entrées, sorties et stock instantanément' },
    { icon: <TrendingUp className="h-6 w-6" />, title: 'Bénéfices auto', desc: 'Marge, CA et profit calculés pour chaque article' },
    { icon: <DollarSign className="h-6 w-6" />, title: 'Prix achat / vente', desc: 'Enregistrez vos prix et voyez vos marges immédiatement' },
    { icon: <Smartphone className="h-6 w-6" />, title: 'Mobile first', desc: 'Interface pensée pour le téléphone, utilisable en boutique' },
    { icon: <Shield className="h-6 w-6" />, title: 'Données privées', desc: 'Vos données ne sont accessibles qu\'à vous' },
    { icon: <Users className="h-6 w-6" />, title: 'Multi-boutiques', desc: 'Un compte par commerçante, stock isolé' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <Package className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Ma Boutique</span>
          </div>
          <Link href="/auth/login" className="px-5 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 touch-manipulation transition-colors">
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Gérez votre stock<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">simplement</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Ce qui entre, ce qui sort, ce qui reste. L'application pensée pour les commerçantes qui veulent voir leurs bénéfices en un coup d'œil.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/auth/login"
          className="block w-full max-w-xs mx-auto py-4 rounded-2xl font-semibold text-lg text-white text-center shadow-xl dark:shadow-gray-900/30 active:shadow-lg transition-all touch-manipulation"
          style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
        >
          <span className="flex items-center justify-center space-x-2">
            Commencer gratuitement
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>

        {/* Trust indicators */}
        <div className="flex items-center justify-center space-x-8 mt-10 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Gratuit</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Sécurisé</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Smartphone className="h-4 w-4 text-green-500" />
            <span>Mobile</span>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 space-y-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">Pourquoi Ma Boutique ?</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md dark:hover:shadow-none transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white" style={{ background: `linear-gradient(135deg, ${['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'][i]}, ${['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'][i]}dd)` }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-5">3 étapes pour démarrer</h2>
          <div className="grid grid-cols-3 gap-4">
            <StepStep number="1" title="Créer votre compte" desc="Email, mot de passe, c'est tout" />
            <StepStep number="2" title="Ajouter vos articles" desc="Nom, prix, photo, stock initial" />
            <StepStep number="3" title="Vendre & gagner" desc="Entrées, sorties, bénéfices auto" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-8 mt-16">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Ma Boutique — Gestion de stock simple pour commerçantes
        </div>
      </footer>
    </div>
  );
}

function StepStep({ number, title, desc }: { number: string | number; title: string; desc: string }) {
  return (
    <div className="text-center relative">
      <div className="relative">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
          {number}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
