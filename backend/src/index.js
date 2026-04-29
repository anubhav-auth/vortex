import { env } from './config/env.js';
import { prisma } from './config/db.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';
app.use(cors({ origin: corsOrigin }));

app.use(helmet());
app.use(express.json());

// ── Dev 4: Core ──────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.get('/api/domains', async (_req, res, next) => {
  try {
    const domains = await prisma.domain.findMany({ orderBy: { name: 'asc' } });
    res.json(domains);
  } catch (err) { next(err); }
});

app.get('/api/domains/:id', async (req, res, next) => {
  try {
    const domain = await prisma.domain.findUnique({ where: { id: req.params.id } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    res.json(domain);
  } catch (err) { next(err); }
});

// ── Dev 1: Students & Verification (Phases 4-5, 7-8) ────────────────────────
//   POST   /api/register
//   GET    /api/domains/:id/students
//   PATCH  /api/admin/students/:id/verify
//   POST   /api/admin/domains/:id/verify
//   GET    /api/students/verified

// ── Dev 2: Teams (Phases 10-12) ──────────────────────────────────────────────
//   POST   /api/teams
//   POST   /api/teams/:id/members
//   DELETE /api/teams/:id/members/:studentId
//   GET    /api/teams/:id/validate
//   POST   /api/teams/:id/confirm
//   GET    /api/teams/:id

// ── Dev 3: Evaluations & Leaderboard (Phases 14, 17-18) ─────────────────────
//   GET    /api/problem-statements
//   POST   /api/problem-statements
//   DELETE /api/admin/problem-statements/:id
//   POST   /api/evaluations
//   GET    /api/teams/:id/evaluations
//   GET    /api/evaluations?round=N
//   POST   /api/admin/leaderboard/calculate
//   GET    /api/leaderboard

// ── Dev 4: Awards (Phase 21) ─────────────────────────────────────────────────
// Computes all awards from leaderboard + evaluation data.
// Requires Dev 3 to have called POST /api/admin/leaderboard/calculate first.
app.get('/api/awards', async (_req, res, next) => {
  try {
    const leaderboard = await prisma.leaderboard.findMany({
      where: { rankPosition: { not: null } },
      orderBy: { rankPosition: 'asc' },
      include: {
        team: {
          include: { problemStatement: { include: { domain: true } } },
        },
      },
    });

    if (leaderboard.length === 0) {
      return res.json({ awards: null, message: 'Leaderboard not calculated yet' });
    }

    // Grand Prize: rank 1
    const grandPrize = leaderboard[0];

    // Domain Excellence: highest-ranked team per PS domain
    const domainBest = {};
    for (const entry of leaderboard) {
      const domain = entry.team?.problemStatement?.domain?.name;
      if (domain && !domainBest[domain]) domainBest[domain] = entry;
    }

    // Innovation Award: team with highest average Round 1 score
    // Note: score is a single Float with no per-criterion breakdown (PRD limitation).
    const r1Evals = await prisma.evaluation.findMany({ where: { round: 1 } });
    const r1Avg = {};
    for (const e of r1Evals) {
      if (!r1Avg[e.teamId]) r1Avg[e.teamId] = { sum: 0, count: 0 };
      r1Avg[e.teamId].sum += e.score;
      r1Avg[e.teamId].count++;
    }
    const topR1 = Object.entries(r1Avg)
      .map(([teamId, { sum, count }]) => ({ teamId, avg: sum / count }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;

    let innovationAward = null;
    if (topR1) {
      const inBoard = leaderboard.find(e => e.teamId === topR1.teamId);
      if (inBoard) {
        innovationAward = { ...inBoard, avgR1Score: topR1.avg };
      } else {
        const team = await prisma.team.findUnique({
          where: { id: topR1.teamId },
          include: { problemStatement: { include: { domain: true } } },
        });
        innovationAward = { teamId: topR1.teamId, team, avgR1Score: topR1.avg };
      }
    }

    // Best Presentation: team with highest average Grand Finale score
    const gfEvals = await prisma.evaluation.findMany({ where: { round: 3 } });
    const gfAvg = {};
    for (const e of gfEvals) {
      if (!gfAvg[e.teamId]) gfAvg[e.teamId] = { sum: 0, count: 0 };
      gfAvg[e.teamId].sum += e.score;
      gfAvg[e.teamId].count++;
    }
    const topGf = Object.entries(gfAvg)
      .map(([teamId, { sum, count }]) => ({ teamId, avg: sum / count }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;

    let bestPresentation = null;
    if (topGf) {
      const inBoard = leaderboard.find(e => e.teamId === topGf.teamId);
      if (inBoard) {
        bestPresentation = { ...inBoard, avgGfScore: topGf.avg };
      } else {
        const team = await prisma.team.findUnique({
          where: { id: topGf.teamId },
          include: { problemStatement: { include: { domain: true } } },
        });
        bestPresentation = { teamId: topGf.teamId, team, avgGfScore: topGf.avg };
      }
    }

    // Most Adaptive & People's Choice require jury/audience vote mechanisms
    // not present in the current schema — out of scope for Phase 21.

    res.json({
      awards: {
        grandPrize,
        domainExcellence: Object.values(domainBest),
        innovationAward,
        bestPresentation,
      },
    });
  } catch (err) { next(err); }
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[error]', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Already exists', field: err.meta?.target });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ error: 'Record is in use', field: err.meta?.field_name });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Vortex API listening on http://localhost:${env.PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ Port ${env.PORT} is already in use`);
    } else {
      console.error('✗ Server error:', err.message);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`\n[${signal}] shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();

export { app, prisma };
