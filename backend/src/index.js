import { env } from './config/env.js';
import { prisma } from './config/db.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { logger } from './utils/logger.js';
import { requestLog } from './middleware/requestLog.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import registrationRoutes from './routes/registration.js';
import adminVerificationRoutes from './routes/adminVerification.js';
import registryRoutes from './routes/registry.js';
import teamRoutes from './routes/teams.js';
import inviteRoutes from './routes/invites.js';
import joinRequestRoutes from './routes/joinRequests.js';
import membershipChangeRoutes from './routes/membershipChanges.js';
import adminTeamRoutes from './routes/adminTeams.js';
import adminRulesRoutes from './routes/adminRules.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security headers first, then CORS so preflights carry helmet's headers too.
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (env.CORS_ORIGIN.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// Generous JSON limit — registration carries a base64 photo until we move to
// object storage. Tune downward once uploads are externalized.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(requestLog);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/admin/verification', adminVerificationRoutes);
app.use('/api/admin/registry', registryRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/membership-changes', membershipChangeRoutes);
app.use('/api/admin/teams', adminTeamRoutes);
app.use('/api/admin/rules', adminRulesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info('server started', { port: env.PORT, env: env.NODE_ENV });
});

const shutdown = async (signal) => {
  logger.info('shutdown', { signal });
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // hard exit if close() hangs
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', { reason: String(reason) }));
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err: err.message, stack: err.stack });
  process.exit(1);
});
