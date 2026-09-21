"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = {
  id: string;
  email: string;
  nom: string;
  couleur: string;
  boutiqueActive?: boolean;
  boutiqueNom?: string;
  boutiqueDescription?: string;
  boutiqueLogoUrl?: string;
  boutiqueSlug?: string;
  boutiqueAccentColor?: string;
  boutiqueWhatsApp?: string;
  whatsapp?: string;
};

type Session = {
  user: User | null;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setSession({ user: data.user });
      } else {
        setSession({ user: null });
      }
    } catch {
      setSession({ user: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return context;
}