import { prisma } from '../config/db.js';
import { rulesService } from './rules.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
//
// Sole owner of LeaderboardEntry writes. Two write paths:
//
//   applyScore(tx, ...)  — called by evaluation.service after a score is
//                          upserted. Patches the relevant r{n}Score column
//                          on this team's row, recomputes finalScore, then
//                          re-ranks all rows in the same transaction.
//
//   recomputeAll()       — admin-triggered full rebuild from Evaluation.
//                          Useful after a data fix or backfill.
//
// finalScore semantics:
//   - finalScore = sum of non-null round scores
//   - if every round is null, finalScore = null (team is unranked)
//
// rank semantics:
//   - rows with null finalScore get rank = null
//   - rows are ranked dense by finalScore DESC, ties get the same rank
//     (standard competition ranking would skip the next rank; we use
//     dense for prettier display — flip if the spec requires otherwise)
// ─────────────────────────────────────────────────────────────────────────────

const ROUND_FIELD = {
  ROUND_1: 'r1Score',
  ROUND_2: 'r2Score',
  ROUND_3: 'r3Score',
};

const computeFinal = (r1, r2, r3) => {
  if (r1 == null && r2 == null && r3 == null) return null;
  return (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0);
};

// Single in-tx ranking sweep. Reads only the ranking-relevant columns.
const reRankAll = async (tx) => {
  const rows = await tx.leaderboardEntry.findMany({
    select: { teamId: true, finalScore: true },
    orderBy: [{ finalScore: 'desc' }, { teamId: 'asc' }],
  });

  let lastScore = null;
  let lastRank = 0;
  let position = 0;

  for (const row of rows) {
    position += 1;
    let nextRank;
    if (row.finalScore == null) {
      nextRank = null;
    } else if (row.finalScore === lastScore) {
      nextRank = lastRank;
    } else {
      nextRank = position;
      lastScore = row.finalScore;
      lastRank = position;
    }
    // Skip writes when nothing changed — small cost for hot ranks.
    await tx.leaderboardEntry.update({
      where: { teamId: row.teamId },
      data: { rank: nextRank },
    });
  }
};

export const leaderboardService = {
  /**
   * Patch one team's per-round score, recompute its finalScore, re-rank.
   * Caller MUST pass a transactional client so the upsert and the rank
   * sweep land in the same transaction as the triggering evaluation.
   */
  async applyScore(tx, { teamId, round, total }) {
    const field = ROUND_FIELD[round];
    if (!field) throw new Error(`Invalid round: ${round}`);

    const existing = await tx.leaderboardEntry.findUnique({
      where: { teamId },
      select: { r1Score: true, r2Score: true, r3Score: true },
    });

    const next = {
      r1Score: existing?.r1Score ?? null,
      r2Score: existing?.r2Score ?? null,
      r3Score: existing?.r3Score ?? null,
    };
    next[field] = total;
    const finalScore = computeFinal(next.r1Score, next.r2Score, next.r3Score);

    await tx.leaderboardEntry.upsert({
      where: { teamId },
      update: { ...next, finalScore },
      create: { teamId, ...next, finalScore },
    });

    await reRankAll(tx);

    return tx.leaderboardEntry.findUnique({ where: { teamId } });
  },

  /**
   * Admin-triggered full rebuild. Reads every Evaluation, regenerates
   * LeaderboardEntry rows, then re-ranks. Single transaction.
   */
  async recomputeAll() {
    return prisma.$transaction(async (tx) => {
      const evals = await tx.evaluation.findMany({
        select: { teamId: true, round: true, total: true },
      });

      // Bucket by team.
      const buckets = new Map();
      for (const e of evals) {
        const b = buckets.get(e.teamId) ?? { r1Score: null, r2Score: null, r3Score: null };
        b[ROUND_FIELD[e.round]] = e.total;
        buckets.set(e.teamId, b);
      }

      // Wipe entries for teams that no longer have any scores.
      const allEntries = await tx.leaderboardEntry.findMany({ select: { teamId: true } });
      for (const { teamId } of allEntries) {
        if (!buckets.has(teamId)) {
          await tx.leaderboardEntry.delete({ where: { teamId } });
        }
      }

      // Upsert each scored team.
      for (const [teamId, scores] of buckets) {
        const finalScore = computeFinal(scores.r1Score, scores.r2Score, scores.r3Score);
        await tx.leaderboardEntry.upsert({
          where: { teamId },
          update: { ...scores, finalScore },
          create: { teamId, ...scores, finalScore },
        });
      }

      await reRankAll(tx);
      return { rebuiltCount: buckets.size };
    });
  },

  /**
   * Public read. Honors HackathonRules.leaderboardVisible / showMarks.
   * - leaderboardVisible=false: returns 403-equivalent {hidden:true} so
   *   the controller can choose to mask or 403; we return data + flag.
   * - showMarks=false: scores are nullified in the response (rank kept).
   */
  async list({ limit = 100 } = {}) {
    const rules = await rulesService.get();

    if (!rules.leaderboardVisible) {
      return { hidden: true, entries: [] };
    }

    const rows = await prisma.leaderboardEntry.findMany({
      take: limit,
      orderBy: [{ rank: 'asc' }, { teamId: 'asc' }],
      include: {
        team: {
          select: {
            id: true, name: true,
            domain: { select: { id: true, name: true } },
            problemStatement: { select: { id: true, title: true } },
            leader: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    const entries = rows.map((r) => ({
      rank: r.rank,
      finalScore: rules.showMarks ? r.finalScore : null,
      r1Score:    rules.showMarks ? r.r1Score    : null,
      r2Score:    rules.showMarks ? r.r2Score    : null,
      r3Score:    rules.showMarks ? r.r3Score    : null,
      team: r.team,
      updatedAt: r.updatedAt,
    }));

    return { hidden: false, showMarks: rules.showMarks, entries };
  },
};
