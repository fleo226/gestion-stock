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
// connexion dédiée pour $transaction ; à travers un pooler en mode
// transaction, les requêtes d'une même transaction peuvent changer de
// connexion et casser l'atomicité. DATABASE_URL_DIRECT pointe vers le
// pooler en mode SESSION (5432), qui épingle la connexion : les
// transactions y sont fiables.
export const dbDirect = globalForPrisma.prismaDirect ?? new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_DIRECT } },
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDirect = dbDirect;
