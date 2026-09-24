'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Copy, Check, Save, Loader2, MessageCircle,
  Upload, X, Camera, AlertCircle, ExternalLink,
} from 'lucide-react';

type OrangeMoneyType = 'MARCHAND' | 'PARTICULIER';

type Boutique = {
  id: string;
  boutiqueNom: string | null;
  boutiqueSlug: string | null;
  boutiqueDescription: string | null;
  boutiqueLogoUrl: string | null;
  boutiqueWhatsApp: string | null;
  boutiqueActive: boolean;
  boutiqueAccentColor: string;
  orangeMoneyType: OrangeMoneyType;
  orangeMoneyCodeMarchand: string | null;
  orangeMoneyNumero: string | null;
  orangeMoneyNomAffichage: string | null;
};

const COLORS = [
  '#2563eb', '#7c3aed', '#ea580c', '#dc2626',
  '#15803d', '#0d9488', '#db2777',
];

export default function ConfigurerBoutiquePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [omType, setOmType] = useState<OrangeMoneyType>('PARTICULIER');
  const [omCode, setOmCode] = useState('');
  const [omNumero, setOmNumero] = useState('');
  const [omNom, setOmNom] = useState('');

  // ===== Load boutique from API =====
  useEffect(() => {
    fetch('/api/boutique/moi')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const b: Boutique = d.boutique;
          setBoutique(b);
          setNom(b.boutiqueNom || '');
          setDescription(b.boutiqueDescription || '');
          setWhatsapp(b.boutiqueWhatsApp || '');
          setLogoUrl(b.boutiqueLogoUrl || null);
          setActive(b.boutiqueActive);
          setAccentColor(b.boutiqueAccentColor || '#2563eb');
          setOmType(b.orangeMoneyType || 'PARTICULIER');
          setOmCode(b.orangeMoneyCodeMarchand || '');
          setOmNumero(b.orangeMoneyNumero || '');
          setOmNom(b.orangeMoneyNomAffichage || b.boutiqueNom || '');
        } else {
          setMessage({ type: 'error', text: d.error || 'Erreur chargement' });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Erreur de connexion' }))
      .finally(() => setLoading(false));
  }, []);

  // ===== Avertissement "changements non sauvegardés" =====
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const markDirty = () => setHasUnsavedChanges(true);

  // ===== Upload logo vers Supabase Storage =====
  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    setMessage(null);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        setMessage({ type: 'error', text: 'Configuration Supabase manquante' });
        return;
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `boutique-logos/${boutique?.id || 'temp'}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Erreur upload logo:', uploadError);
        setMessage({ type: 'error', text: `Upload échoué: ${uploadError.message}` });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      markDirty();
      setMessage({ type: 'success', text: 'Logo uploadé ✅' });
    } catch (err: any) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: `Erreur: ${err.message}` });
    } finally {
      setUploadingLogo(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/boutique/moi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutiqueActive: active,
          boutiqueNom: nom,
          boutiqueDescription: description,
          boutiqueWhatsApp: whatsapp,
          boutiqueLogoUrl: logoUrl,
          boutiqueAccentColor: accentColor,
          orangeMoneyType: omType,
          orangeMoneyCodeMarchand: omType === 'MARCHAND' ? omCode : undefined,
          orangeMoneyNumero: omType === 'PARTICULIER' ? omNumero : undefined,
          orangeMoneyNomAffichage: omNom,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBoutique(data.boutique);
        setHasUnsavedChanges(false);
        setMessage({ type: 'success', text: 'Boutique mise à jour ✅' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

  const boutiqueUrl = boutique?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/boutique/${boutique.id}`
    : '';

  const shareWhatsApp = () => {
    if (!boutique?.id) {
      setMessage({ type: 'error', text: "Enregistrez d'abord votre boutique" });
      return;
    }
    const text = `Bonjour ! Découvrez ma boutique "${nom || 'Ma Boutique'}" : ${boutiqueUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/stock" className="p-2 -ml-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="font-semibold text-gray-900 text-sm">Configurer ma boutique</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {message && (
          <div className={`p-3 rounded-xl text-sm border flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <span className="flex-shrink-0">{message.type === 'success' ? '✓' : '⚠'}</span>
            <span>{message.text}</span>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="p-3 rounded-xl text-sm border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Vous avez des changements non sauvegardés. Pensez à cliquer "Enregistrer".</span>
          </div>
        )}

        {/* === SECTION 1: Activation boutique === */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Boutique en ligne</p>
              <p className="text-xs text-gray-500">Visible par vos clientes</p>
            </div>
            <button
              type="button"
              onClick={() => { setActive(!active); markDirty(); }}
              className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Activer la boutique"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {active && (
            <p className="text-[11px] text-green-700 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Boutique active
            </p>
          )}
        </section>

        {/* === SECTION 2: Logo boutique === */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-3">Logo boutique</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0 relative">
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(null); markDirty(); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                    aria-label="Supprimer le logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2">
                  <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500">Ajouter</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium hover:bg-blue-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? 'Upload...' : 'Choisir un logo'}
              </button>
              <p className="text-[10px] text-gray-500 mt-2">
                PNG ou JPG, max 2MB. Sera affiché sur votre boutique publique.
              </p>
            </div>
          </div>
        </section>

        {/* === SECTION 3: Infos générales === */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs uppercase font-semibold text-gray-500">Informations</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => { setNom(e.target.value); markDirty(); }}
              placeholder="Ex: Boutique de Aminata"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder="Ex: Vêtements & accessoires • Ouagadougou"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp (pour les commandes)</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => { setWhatsapp(e.target.value); markDirty(); }}
              placeholder="+226 70 12 34 56"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">Vous recevrez les preuves de paiement sur ce numéro</p>
          </div>
        </section>

        {/* === SECTION 4: Couleur d'accent === */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-3">Couleur de la boutique</p>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setAccentColor(c); markDirty(); }}
                className={`w-9 h-9 rounded-full transition-transform ${accentColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Apparaîtra sur le header de votre boutique publique</p>
        </section>

        {/* === SECTION 5: Orange Money === */}
        <section className="bg-white rounded-2xl border-2 border-orange-400 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm font-bold">OM</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Paiement Orange Money</p>
              <p className="text-[10px] text-gray-500">Comment vos clients vous paient</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { setOmType('MARCHAND'); markDirty(); }}
              className={`w-full text-left rounded-xl p-3 border-2 transition-colors ${omType === 'MARCHAND' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${omType === 'MARCHAND' ? 'border-blue-600' : 'border-gray-300'}`}>
                  {omType === 'MARCHAND' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">Compte Marchand</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Vous avez un code marchand Orange Money (commerçant enregistré)</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setOmType('PARTICULIER'); markDirty(); }}
              className={`w-full text-left rounded-xl p-3 border-2 transition-colors ${omType === 'PARTICULIER' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${omType === 'PARTICULIER' ? 'border-blue-600' : 'border-gray-300'}`}>
                  {omType === 'PARTICULIER' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">Compte Particulier</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Transfert classique vers votre numéro Orange Money</p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {omType === 'MARCHAND' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code Marchand (6 chiffres)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={omCode}
                  onChange={(e) => { setOmCode(e.target.value.replace(/\D/g, '')); markDirty(); }}
                  placeholder="123456"
                  className="w-full px-3 py-2 text-base font-mono tracking-widest rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">Code à 6 chiffres fourni par Orange Money</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Votre numéro Orange Money</label>
                <input
                  type="tel"
                  value={omNumero}
                  onChange={(e) => { setOmNumero(e.target.value); markDirty(); }}
                  placeholder="+226 70 12 34 56"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">Numéro sur lequel les clientes enverront le paiement</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom affiché au client</label>
              <input
                type="text"
                value={omNom}
                onChange={(e) => { setOmNom(e.target.value); markDirty(); }}
                placeholder={nom || 'Votre nom'}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <p className="text-[10px] text-gray-500 mt-1">Votre nom que verront les clientes dans les instructions</p>
            </div>
          </div>

          {/* === Aperçu USSD en temps réel === */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-[10px] uppercase font-semibold text-gray-500 mb-2">Aperçu des instructions que verra le client</p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex gap-2 items-center">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                <span className="font-mono font-bold text-blue-600">{omType === 'MARCHAND' ? '*144*10#' : '*144*2*1#'}</span>
              </div>
              {omType === 'MARCHAND' ? (
                <>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <span>Choisir "Paiement Marchand"</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <span>Code : <span className="font-mono font-bold text-blue-600">{omCode || '______'}</span></span>
                  </div>
                </>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <span>Numéro : <span className="font-mono font-bold text-blue-600">{omNumero || '+226 __ __ __ __'}</span></span>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <span className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">↓</span>
                <span>Montant + référence + code PIN + #</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic mt-2">⚠️ Ces instructions s'affichent à chaque commande client. Vérifiez bien votre choix.</p>
          </div>
        </section>

        {/* === SECTION 6: Lien boutique + partage === */}
        {boutique && (
          <section className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Votre lien boutique</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
              <span className="text-xs text-blue-600 font-mono truncate flex-1">{boutiqueUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(boutiqueUrl, 'url')}
                className="p-1.5 rounded bg-blue-600 text-white"
                aria-label="Copier le lien"
              >
                {copied === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Partager WhatsApp
              </button>
              <Link
                href={`/boutique/${boutique.id}`}
                target="_blank"
                className="bg-blue-50 text-blue-700 border border-blue-200 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma boutique
              </Link>
            </div>
          </section>
        )}

        <div className="h-4" />
      </main>

      {/* === Sticky Save button === */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={save}
            disabled={saving || !hasUnsavedChanges}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : hasUnsavedChanges ? 'Enregistrer' : 'Modifications enregistrées'}
          </button>
        </div>
      </div>
    </div>
  );
}
