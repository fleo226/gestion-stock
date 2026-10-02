import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDirect: PrismaClient | undefined;
};

// Client principal : pooler en mode transaction (6543) — adapté au serverless.
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Client dédié aux transactions interactives (audit B3) : Prisma exige une
// connexion épinglée pour $transaction ; à travers un pooler en mode
// transaction, les requêtes d'une même transaction peuvent changer de
// connexion et casser l'atomicité. DATABASE_URL_DIRECT pointe vers le
// pooler en mode SESSION (5432) qui garantit cette épinglage.
// Construction paresseuse : le module reste importable au build sans
// variable d'environnement, l'erreur ne survient qu'à l'usage réel.
export function getDbDirect(): PrismaClient {
  if (!globalForPrisma.prismaDirect) {
    const url = process.env.DATABASE_URL_DIRECT;
    if (!url || !/^postgres(ql)?:\/\//.test(url)) {
      throw new Error(
        'DATABASE_URL_DIRECT manquante ou invalide : requise pour les transactions (pooler en mode session, ex. postgresql://…@…pooler.supabase.com:5432/postgres)'
      );
    }
    globalForPrisma.prismaDirect = new PrismaClient({
      datasources: { db: { url } },
      log: ['error'],
    });
  }
  return globalForPrisma.prismaDirect;
}
