import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interface pour les types
export interface User {
  id: string;
  email?: string;
  nom?: string;
  couleur?: string;
  creeLe?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// Fonctions pour l'authentification
export async function signUp(email: string, password: string, nom: string, couleur: string = '#2563eb') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nom,
        couleur,
      },
      emailRedirectTo: undefined // Désactive la confirmation par email
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
}

export async function updateUserProfile(nom: string, couleur: string) {
  const { data, error } = await supabase.auth.updateUser({
    data: { nom, couleur }
  });

  if (error) throw error;
  return data;
}

// Middleware pour protéger les routes
export async function requireAuth(request: NextRequest): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Non authentifié');
  }
  
  return user;
}

// Fonction pour créer un cookie de session
export function createSessionCookie(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

// Fonction pour lire un cookie de session
export function readSessionCookie(cookie: string | undefined): Session | null {
  if (!cookie) return null;
  
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString());
  } catch {
    return null;
  }
}