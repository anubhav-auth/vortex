import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 reads the connection URL from this file (the `url` field was
// removed from schema.prisma). Keep the placeholder fallback so commands
// like `prisma generate` don't crash when DATABASE_URL is absent at
// build time (e.g. inside the Docker builder stage).

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder',
  },
});
