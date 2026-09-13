import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function migrateArticlesToUser(userId: string = 'default-user-id'): Promise<number> {
  const { count, error } = await supabase
    .from('Article')
    .update({ userId })
    .eq('userId', null)
    .neq('id', null);

  if (error) throw error;
  return count || 0;
}

export async function createDefaultUser(): Promise<void> {
  const { data, error } = await supabase
    .from('User')
    .upsert({
      id: 'default-user-id',
      email: 'demo@ma-boutique.com',
      nom: 'Ma Boutique Demo',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      couleur: '#2563eb',
      creeLe: new Date().toISOString()
    }, { onConflict: 'email' });

  if (error) throw error;
}

export async function checkMigrationStatus(): Promise<{
  usersCount: number;
  articlesCount: number;
  migratedArticlesCount: number;
}> {
  const [usersResult, articlesResult, migratedResult] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Article').select('*', { count: 'exact', head: true }),
    supabase.from('Article').select('*', { count: 'exact', head: true }).eq('userId', 'default-user-id')
  ]);

  return {
    usersCount: usersResult.count || 0,
    articlesCount: articlesResult.count || 0,
    migratedArticlesCount: migratedResult.count || 0
  };
}