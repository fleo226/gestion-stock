'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Package, MessageCircle, Check, Clock, X, Minus } from 'lucide-react';

type Commande = {
  id: string;
  total: number;
  statut: string;
  reference: string;
  clientNom: string;
  creeLe: string;
  lignes: { quantite: number; prixUnitaire: number; article: { nom: string } }[];
};

type Vendeur = {
  boutiqueNom: string;
  boutiqueWhatsApp: string | null;
  boutiqueAccentColor: string;
};

export default function SuiviPage() {
  const params = useParams();
  const vendeurId = params.vendeurId as string;
  const commandeId = params.commandeId as string;

  const [commande, setCommande] = useState<Commande | null>(null);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommande = async () => {
      try {
        const res = await fetch(`/api/boutique/${vendeurId}/commande/${commandeId}`);
        const data = await res.json();
        if (data.success) {
          setCommande(data.data.commande);
          setVendeur(data.data.vendeur);
        } else {
          setError(data.error || 'Commande introuvable');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    fetchCommande();
  }, [vendeurId, commandeId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const min = Math.floor(diff / (1000 * 60));
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const contacterVendeuse = () => {
    if (!vendeur?.boutiqueWhatsApp) return;
    const msg = `Bonjour ${vendeur.boutiqueNom}, j'ai une question sur ma commande ${commande?.reference}`;
    const url = `https://wa.me/${vendeur.boutiqueWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !commande || !vendeur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || 'Commande introuvable'}</p>
        </div>
      </div>
    );
  }

  const accentColor = vendeur.boutiqueAccentColor || '#2563eb';
  const total = commande.total.toLocaleString();

  // === Configuration du statut ===
  const isAnnulee = commande.statut === 'ANNULEE';
  const isConfirmee = commande.statut === 'CONFIRMEE';
  const isAttenteValidation = commande.statut === 'EN_ATTENTE_VALIDATION';
  const isAttentePaiement = commande.statut === 'EN_ATTENTE_PAIEMENT';

  // === Configuration de l'encart statut ===
  const statusConfig = isAnnulee
    ? { bg: 'bg-red-50 border-red-200', icon: <X className="h-5 w-5 text-red-500" />, title: 'Commande annulée', desc: 'Cette commande a été annulée', color: 'text-red-700' }
    : isConfirmee
    ? { bg: 'bg-green-50 border-green-200', icon: <Check className="h-5 w-5 text-green-600" />, title: 'Commande confirmée', desc: 'La vendeuse a validé votre paiement', color: 'text-green-700' }
    : isAttenteValidation
    ? { bg: 'bg-amber-50 border-amber-200', icon: <Clock className="h-5 w-5 text-amber-500" />, title: 'En attente de validation', desc: 'La vendeuse vérifie votre paiement Orange Money', color: 'text-amber-700' }
    : { bg: 'bg-blue-50 border-blue-200', icon: <Clock className="h-5 w-5 text-blue-500" />, title: 'En attente de paiement', desc: 'Effectuez votre paiement Orange Money', color: 'text-blue-700' };

  // === Étapes timeline ===
  const steps = [
    { label: 'Commande créée', desc: formatDate(commande.creeLe), done: true, active: false },
    { label: 'Paiement Orange Money', desc: isAttentePaiement ? 'En attente de paiement' : 'Paiement envoyé', done: !isAttentePaiement, active: isAttentePaiement },
    { label: 'Validation de la vendeuse', desc: isAttenteValidation ? 'Vérification en cours' : '', done: isConfirmee, active: isAttenteValidation },
    { label: 'Commande confirmée', desc: isConfirmee ? 'Préparation du colis' : '', done: isConfirmee, active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === Header === */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Ma commande</h1>
            <p className="text-[10px] font-mono font-bold" style={{ color: accentColor }}>{commande.reference}</p>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
            {vendeur.boutiqueNom}
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* === Encart statut === */}
        <div className={`rounded-xl p-3 flex items-start gap-3 border ${statusConfig.bg}`}>
          <div className="flex-shrink-0 mt-0.5">
            {statusConfig.icon}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${statusConfig.color}`}>{statusConfig.title}</h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{statusConfig.desc}</p>
            {(isAttenteValidation || isAttentePaiement) && (
              <p className="text-[10px] text-gray-500 mt-1">Délai estimé : 5 à 15 minutes</p>
            )}
          </div>
        </div>

        {/* === Timeline === */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">Progression</h4>

          <div className="relative pl-6 space-y-5">
            {/* Ligne verticale */}
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />

            {steps.map((step, i) => (
              <div key={i} className={`relative ${!step.done && !step.active ? 'opacity-40' : ''}`}>
                {/* Cercle */}
                <span
                  className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white ${
                    step.done
                      ? 'bg-green-500 text-white'
                      : step.active
                      ? 'bg-amber-400 text-white ring-2 ring-amber-300 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.done ? <Check className="h-2.5 w-2.5" /> : step.active ? '●' : ''}
                </span>

                {/* Texte */}
                <div>
                  <p className={`text-sm font-semibold ${step.done ? 'text-gray-900' : step.active ? 'text-amber-800' : 'text-gray-500'}`}>
                    {step.label}
                  </p>
                  {step.desc && (
                    <p className={`text-[10px] ${step.active ? 'text-amber-600' : 'text-gray-400'}`}>
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === Récap commande === */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-xs">
          <div className="flex justify-between items-center text-gray-600 border-b border-gray-100 pb-2 mb-2">
            <span>Articles commandés ({commande.lignes.length})</span>
            <span className="font-bold text-gray-900">{total} FCFA</span>
          </div>
          {commande.lignes.map((ligne, i) => (
            <div key={i} className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>• {ligne.quantite}x {ligne.article.nom}</span>
              <span>{(ligne.prixUnitaire * ligne.quantite).toLocaleString()} F</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
            <span className="text-gray-500">Client</span>
            <span className="font-medium text-gray-900">{commande.clientNom}</span>
          </div>
        </div>
      </main>

      {/* === Sticky bottom : WhatsApp === */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-md">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={contacterVendeuse}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Contacter la vendeuse sur WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
