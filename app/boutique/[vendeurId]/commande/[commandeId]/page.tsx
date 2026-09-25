'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Check, MessageCircle, Loader2, Package, Phone } from 'lucide-react';

type Commande = {
  id: string;
  total: number;
  statut: string;
  reference: string;
  clientNom: string;
  lignes: { quantite: number; prixUnitaire: number; article: { nom: string } }[];
};

type Vendeur = {
  boutiqueNom: string;
  boutiqueWhatsApp: string | null;
  boutiqueAccentColor: string;
  orangeMoneyType: 'MARCHAND' | 'PARTICULIER';
  orangeMoneyCodeMarchand: string | null;
  orangeMoneyNumero: string | null;
  orangeMoneyNomAffichage: string | null;
};

export default function PaiementPage() {
  const params = useParams();
  const vendeurId = params.vendeurId as string;
  const commandeId = params.commandeId as string;

  const [commande, setCommande] = useState<Commande | null>(null);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

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

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const envoyerPreuveWhatsApp = () => {
    if (!vendeur?.boutiqueWhatsApp) return;
    const msg = `Bonjour ${vendeur.boutiqueNom} ! J'ai payé ma commande ${commande?.reference} de ${commande?.total.toLocaleString()} FCFA via Orange Money. Merci de vérifier et confirmer.`;
    const url = `https://wa.me/${vendeur.boutiqueWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
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

  const isMarchand = vendeur.orangeMoneyType === 'MARCHAND';
  const total = commande.total;
  const totalStr = String(total);
  const ref = commande.reference;

  // Nettoyer le numéro (garder que les chiffres, max 8 derniers)
  const cleanNumero = (vendeur.orangeMoneyNumero || '').replace(/[^\d]/g, '').slice(-8);
  const cleanCode = (vendeur.orangeMoneyCodeMarchand || '').replace(/[^\d]/g, '');

  // === Code USSD complet auto-composé ===
  // Marchand : *144*10*CODE*MONTANT#
  // Particulier : *144*2*1*NUMERO*MONTANT#
  const ussdComplet = isMarchand
    ? `*144*10*${cleanCode}*${totalStr}`
    : `*144*2*1*${cleanNumero}*${totalStr}`;
  
  // Lien tel: (%23 = # encodé)
  const telLink = `tel:${ussdComplet}%23`;

  // Code USSD simple (sans auto-compose)
  const ussdSimple = isMarchand ? '*144*10#' : '*144*2*1#';

  const omNom = vendeur.orangeMoneyNomAffichage || vendeur.boutiqueNom;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* === Header Orange Money === */}
      <div className="rounded-b-2xl shadow-sm" style={{ backgroundColor: '#ff6600' }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ backgroundColor: '#000' }}>
                OM
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">Paiement Orange Money</h1>
                <p className="text-[10px] text-orange-100">{vendeur.boutiqueNom} • BF</p>
              </div>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md font-mono">226</span>
          </div>

          {/* Montant */}
          <div className="bg-black/15 p-3 rounded-xl text-center border border-white/20">
            <p className="text-[10px] uppercase font-bold text-orange-100">Montant exact à payer</p>
            <p className="text-2xl font-black tracking-tight text-white mt-0.5">{total.toLocaleString()} FCFA</p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white/20 px-2.5 py-1 rounded-full text-[10px]">
              <span>Réf : <strong className="font-mono">{ref}</strong></span>
              <button onClick={() => copyToClipboard(ref, 'ref')} className="text-[9px] underline font-bold">
                {copied === 'ref' ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === Bouton auto-compose (GROS, en premier) === */}
      <div className="max-w-2xl mx-auto px-4 -mt-3 relative z-10 mb-4">
        <a
          href={telLink}
          className="block w-full bg-white border-2 border-orange-400 rounded-2xl p-4 text-center shadow-md active:scale-95 transition"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Phone className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-sm text-gray-900">Composez automatiquement</span>
          </div>
          <p className="text-lg font-bold font-mono text-orange-600 tracking-wider">{ussdComplet}#</p>
          <p className="text-[10px] text-gray-500 mt-1">Cliquez pour ouvrir le téléphone avec le code déjà composé</p>
        </a>
      </div>

      {/* === Instructions détaillées === */}
      <div className="max-w-2xl mx-auto px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-800">Instructions détaillées</h2>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">USSD</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
          {/* Étape 1 */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">Composez sur votre téléphone :</p>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-center font-mono font-bold text-sm text-gray-900 tracking-wider">
                {ussdSimple}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ou cliquez le bouton orange ci-dessus pour composer automatiquement</p>
            </div>
          </div>

          {/* Étape 2 : Marchand uniquement */}
          {isMarchand && (
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-xs text-gray-700 pt-0.5">Choisissez <strong>"Paiement Marchand"</strong></p>
            </div>
          )}

          {/* Étape 3 : Code marchand OU Numéro */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{isMarchand ? 3 : 2}</span>
            <div className="flex-1 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-gray-700">
                {isMarchand ? `Code marchand : ` : `Numéro destinataire : `}
                <strong className="font-mono font-bold text-gray-900">
                  {isMarchand ? (cleanCode || '______') : (cleanNumero || '________')}
                </strong>
              </span>
              <button
                onClick={() => copyToClipboard(isMarchand ? cleanCode : cleanNumero, 'code')}
                className="text-[10px] bg-orange-600 text-white font-bold px-2 py-1 rounded hover:bg-orange-700 flex items-center gap-1"
              >
                {copied === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'code' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Étape 4 : Montant */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{isMarchand ? 4 : 3}</span>
            <p className="text-xs text-gray-700 pt-0.5">Entrez le montant : <strong className="text-orange-600 font-bold">{total.toLocaleString()} FCFA</strong></p>
          </div>

          {/* Étape 5 : Référence */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{isMarchand ? 5 : 4}</span>
            <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-gray-700">Référence : <strong className="font-mono font-bold text-gray-900">{ref}</strong></span>
              <button
                onClick={() => copyToClipboard(ref, 'ref2')}
                className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded hover:bg-gray-300 flex items-center gap-1"
              >
                {copied === 'ref2' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'ref2' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Étape 6/5 : PIN */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{isMarchand ? 6 : 5}</span>
            <p className="text-xs text-gray-700 pt-0.5">Entrez votre code secret PIN puis <strong>#</strong></p>
          </div>
        </div>

        {/* Récap commande */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
            <span className="text-gray-600">Articles commandés ({commande.lignes.length})</span>
            <span className="font-bold text-gray-900">{total.toLocaleString()} FCFA</span>
          </div>
          {commande.lignes.map((ligne, i) => (
            <div key={i} className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>• {ligne.quantite}x {ligne.article.nom}</span>
              <span>{(ligne.prixUnitaire * ligne.quantite).toLocaleString()} F</span>
            </div>
          ))}
        </div>
      </div>

      {/* === Sticky bottom : WhatsApp === */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-md">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={envoyerPreuveWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span>J'ai payé → Envoyer preuve WhatsApp</span>
          </button>
          <p className="text-[10px] text-center text-gray-500 mt-1.5">
            Envoie automatiquement au vendeur ({omNom})
          </p>
        </div>
      </div>
    </div>
  );
}
