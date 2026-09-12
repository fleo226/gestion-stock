"use client";

import { useEffect, useState } from "react";
import { Lock, Store, ShieldCheck } from "lucide-react";

const PIN_KEY = "maboutique_pin";
const UNLOCK_KEY = "maboutique_unlocked_v1";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pinConfigure, setPinConfigure] = useState<string | null>(null);
  const [debloque, setDebloque] = useState(false);
  const [ecran, setEcran] = useState<"intro" | "creer" | "entrer">("intro");
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PIN_KEY);
      setPinConfigure(p);
      const u = sessionStorage.getItem(UNLOCK_KEY);
      if (!p || u === "1") setDebloque(true);
      else setEcran("entrer");
    } catch {
      setDebloque(true);
    }
    setReady(true);
  }, []);

  function choisir(proteger: boolean) {
    if (proteger) setEcran("creer");
    else continuerSansCode();
  }

  function continuerSansCode() {
    try {
      sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch {}
    setDebloque(true);
  }

  function validerNouveau() {
    if (!/^\d{4}$/.test(saisie)) {
      setErreur("Le code doit avoir 4 chiffres");
      return;
    }
    try {
      localStorage.setItem(PIN_KEY, saisie);
      sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch {}
    setDebloque(true);
  }

  function validerEntree() {
    if (saisie === pinConfigure) {
      try {
        sessionStorage.setItem(UNLOCK_KEY, "1");
      } catch {}
      setDebloque(true);
    } else {
      setErreur("Code incorrect, réessayez");
      setSaisie("");
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <span className="w-8 h-8 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
      </div>
    );
  }

  if (debloque) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-canvas">
      <div className="w-20 h-20 rounded-3xl bg-brand flex items-center justify-center text-white mb-5">
        <Store size={38} />
      </div>
      <h1 className="text-xl font-bold text-ink text-center">Ma Boutique</h1>
      <p className="text-sm text-ink-soft mt-1 text-center mb-6">
        Votre stock, vos prix et vos marges restent privés.
      </p>

      {ecran === "intro" && (
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => choisir(true)}
            className="w-full py-4 rounded-2xl bg-brand text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Lock size={18} /> Protéger avec un code (4 chiffres)
          </button>
          <button
            onClick={() => choisir(false)}
            className="w-full py-4 rounded-2xl bg-white text-ink-soft font-medium border border-line active:scale-[0.98] transition"
          >
            Continuer sans code
          </button>
        </div>
      )}

      {(ecran === "creer" || ecran === "entrer") && (
        <div className="w-full max-w-xs">
          <p className="text-sm text-ink-soft text-center mb-3">
            {ecran === "creer" ? "Choisissez votre code à 4 chiffres" : "Entrez votre code"}
          </p>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                ecran === "creer" ? validerNouveau() : validerEntree();
            }}
            className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 rounded-2xl border-2 border-brand bg-white text-ink font-bold focus:outline-none"
            placeholder="••••"
          />
          {erreur && <p className="text-danger text-sm font-medium text-center mt-3">{erreur}</p>}
          <button
            onClick={ecran === "creer" ? validerNouveau : validerEntree}
            className="w-full mt-4 py-4 rounded-2xl bg-brand text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <ShieldCheck size={18} /> Valider
          </button>
          <button
            onClick={() => {
              setSaisie("");
              setErreur(null);
              setEcran("intro");
            }}
            className="w-full mt-2 py-3 text-sm text-ink-soft hover:text-ink"
          >
            Retour
          </button>
        </div>
      )}
    </div>
  );
}