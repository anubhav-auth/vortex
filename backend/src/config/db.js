import pkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from './env.js';

const { PrismaClient } = pkg;

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
