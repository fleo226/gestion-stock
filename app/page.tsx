'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          router.push('/stock');
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Ma Boutique</h1>
          <Link 
            href="/auth/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gerer votre stock<br />
            <span className="text-blue-600">simplement</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ce qui entre, ce qui sort, ce qui reste. Une application pensee pour les commerçants.
          </p>
          <Link 
            href="/auth/login" 
            className="inline-flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <span>Commencer gratuitement</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Package className="h-8 w-8" />}
            title="Stock en temps reel"
            desc="Suivez vos entrees, sorties et stock actuel instantanement. Plus de surprises a l'inventaire."
          />
          <FeatureCard 
            icon={<TrendingUp className="h-8 w-8" />}
            title="Benefices calcules"
            desc="Valeur du stock, chiffre d'affaires, marges : tout est calcule automatiquement pour chaque article."
          />
          <FeatureCard 
            icon={<DollarSign className="h-8 w-8" />}
            title="Prix achat & vente"
            desc="Enregistrez vos prix d'achat et de vente. Voyez immediatement votre benefice par article."
          />
        </div>

        {/* Demo */}
        <div className="mt-16 p-8 bg-white rounded-2xl shadow border">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Fonctionnalites principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FeatureList
              items={[
                "Ajouter / modifier / supprimer des articles",
                "Photos pour chaque article",
                "Tailles, couleurs, unites personnalisees",
                "Entrees et sorties de stock tracees",
              ]}
            />
            <FeatureList
              items={[
                "Calcul auto : stock, ventes, benefices, CA",
                "Historique complet des mouvements",
                "Recherche et filtres rapides",
                "Theme personnalisable par utilisateur",
              ]}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          Ma Boutique - Gestion de stock simple pour commercants
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition-shadow">
      <div className="bg-blue-50 p-3 rounded-lg w-fit mb-4 text-blue-600">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2.5 flex-shrink-0" />
          <span className="text-gray-700">{item}</span>
        </div>
      ))}
    </div>
  );
}