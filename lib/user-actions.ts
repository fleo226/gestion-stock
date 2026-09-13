import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  id: string;
  email: string;
  nom: string;
  passwordHash: string;
  couleur: string;
  creeLe: string;
}

export async function createUser(email: string, nom: string, passwordHash: string, couleur: string = '#2563eb'): Promise<User> {
  const { data, error } = await supabase
    .from('User')
    .insert({
      email,
      nom,
      passwordHash,
      couleur,
      creeLe: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserColor(id: string, couleur: string): Promise<User> {
  const { data, error } = await supabase
    .from('User')
    .update({ couleur })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fonction pour créer l'utilisateur par défaut si n'existe pas
export async function ensureDefaultUser(): Promise<User> {
  let user = await getUserByEmail('demo@ma-boutique.com');
  
  if (!user) {
    user = await createUser(
      'demo@ma-boutique.com',
      'Ma Boutique Demo',
      '$2a$10$hashedpasswordplaceholder', // À remplacer par un vrai hash
      '#2563eb'
    );
  }
  
  return user;
}