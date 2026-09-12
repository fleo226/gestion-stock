import { createClient } from "@supabase/supabase-js";

// Client Supabase pour le stockage des photos (bucket "photos")
// Base dédiée gestion-stock — aucun lien avec Faso Cap
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Génère une URL publique stable pour une photo donnée
export function photoPublicUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/photos/${path}`;
}