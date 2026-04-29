import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL:          z.string().min(1).default('file:./prisma/dev.db'),
  PORT:                  z.coerce.number().default(3001),
  NODE_ENV:              z.string().default('development'),
  CORS_ORIGIN:           z.string().optional(),
  ACCESS_TOKEN_SECRET:   z.string().min(1),
  REFRESH_TOKEN_SECRET:  z.string().min(1),
  ACCESS_TOKEN_EXPIRY:   z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY:  z.string().default('7d'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
