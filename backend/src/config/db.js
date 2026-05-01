import pkg from '@prisma/client';
import { env } from './env.js';

const { PrismaClient } = pkg;

export const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL,
});
