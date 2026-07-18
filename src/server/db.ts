import { PrismaClient } from '@prisma/client';

const globalPerPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalPerPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalPerPrisma.prisma = db;
}
