import { PrismaClient } from '@prisma/client';

declare global {
  var __payerPortalPrisma__: PrismaClient | undefined;
}

export function createPrismaClient() {
  return new PrismaClient();
}

export const prisma = globalThis.__payerPortalPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__payerPortalPrisma__ = prisma;
}

export * from '@prisma/client';
