import { createClient } from "@supabase/supabase-js";

// Client ADMIN (service role) — réservé au serveur (jamais importé côté client).
// Utilisé pour l'envoi des photos + suppression.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});