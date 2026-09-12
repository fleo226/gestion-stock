import { db } from "@/lib/db";

// Point de contrôle : garde la base active (anti-pause Supabase) et vérifie la santé.
// Appelé automatiquement par Vercel Cron (voir vercel.json).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const n = await db.article.count();
    return new Response(
      JSON.stringify({ ok: true, articles: n, at: new Date().toISOString() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, erreur: e?.message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}