import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 richiede un driver adapter esplicito per il client (non più solo
 * una stringa di connessione letta automaticamente). Usa DATABASE_URL (la
 * stringa con pooler, porta 6543) - è quella corretta per l'app a runtime;
 * DIRECT_URL (porta 5432) è usata solo dal CLI per le migrazioni, configurata
 * in prisma.config.ts, non qui.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalPerPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalPerPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalPerPrisma.prisma = db;
}
