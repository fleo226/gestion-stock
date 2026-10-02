import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ping — appelée par le cron quotidien (vercel.json, 6h30).
// Maintient la base Supabase active et vérifie la connexion DB.
// (L'expiration automatique des commandes en attente arrivera avec B1.)
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (error) {
    console.error('Erreur ping:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
