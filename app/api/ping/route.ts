import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expirerCommandesPerimees } from '@/lib/commandes';

// GET /api/ping — appelée par le cron quotidien (vercel.json, 6h30).
// Maintient la base Supabase active, vérifie la connexion DB et expire
// les commandes en attente de paiement depuis plus de 2h (audit B1) :
// leur stock est restitué automatiquement.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    let expirees = 0;
    try {
      expirees = await expirerCommandesPerimees();
    } catch (error) {
      console.error('Erreur expiration commandes:', error);
    }
    return NextResponse.json({ ok: true, commandesExpirees: expirees, ts: new Date().toISOString() });
  } catch (error) {
    console.error('Erreur ping:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
