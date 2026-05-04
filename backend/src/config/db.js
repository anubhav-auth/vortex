import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env, isDev } from './env.js';

// Singleton — guarded against duplicate instantiation under `node --watch`
// or any other reload mechanism that re-evaluates this module.
const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg(env.DATABASE_URL),
    log: isDev ? ['warn', 'error'] : ['error'],
  });

export const prisma = globalThis.__prisma ?? createClient();

if (isDev) {
  globalThis.__prisma = prisma;
}
