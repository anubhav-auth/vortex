# Build stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./

RUN npm install
RUN npx prisma generate

COPY . .

# Final stage
FROM node:20-slim AS runner

# Install OpenSSL for Prisma in the final stage too
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Apply any pending Prisma schema changes before booting. Render's free
# tier doesn't allow Pre-Deploy Commands, so we do it here in the CMD.
# Idempotent — does nothing if the schema is already in sync.
CMD npx prisma db push --accept-data-loss --skip-generate && node src/index.js
