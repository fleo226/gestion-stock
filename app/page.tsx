'use client';

import { useState } from 'react';
import { LogOut, Settings, Palette, Moon, Sun } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState({
    id: 'demo-user',
    email: 'demo@ma-boutique.com',
    nom: 'Utilisateur Demo',
    couleur: '#2563eb'
  });

  const [theme, setTheme] = useState('light');

  const handleLogout = () => {
    setUser({ id: '', email: '', nom: '', couleur: '#000000' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Ma Boutique</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bienvenue, {user.nom}!</h2>
          <p className="text-gray-600 mt-2">Gérez votre stock en toute simplicité</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Articles</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">1</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Valeur Stock</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">50,000 FCFA</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Bénéfices</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">15,000 FCFA</p>
          </div>
        </div>

        {/* Sample Article */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exemple d'article</h3>
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Photo</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Robe traditionnelle</h4>
                <p className="text-sm text-gray-600">Taille: M | Couleur: Rouge</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">Stock: 10 pièces</span>
                  <span className="text-sm text-gray-500">Achat: 5,000 FCFA</span>
                  <span className="text-sm text-gray-500">Vente: 8,000 FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Ajouter un article
          </button>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Voir le stock
          </button>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Voir l'activité
          </button>
        </div>
      </main>
    </div>
  );
}