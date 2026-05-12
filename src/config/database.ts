// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the Prisma client.
// Every module must import from HERE — never from config/prisma.ts.
// Delete src/config/prisma.ts after applying this fix.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Prevent multiple instances during hot-reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
