import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { leaderboardService } from './leaderboard.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION
//
// Open scoring model: any jury can score any FINALIZED team while the round
// is UNLOCKED. The DB still enforces ONE canonical score per (team, round)
// via Evaluation @@unique([teamId, round]) — the first jury to submit
// "owns" the slot. Subsequent juries are rejected (the FE shows them an
// 'already scored by X' badge so they know not to try).
//
// Edits are restricted: the original scorer can update their own score.
// A second jury attempting to overwrite is refused with 409.
//
// Scoring guards (all re-checked inside the transaction for race-safety):
//   1. Team must be FINALIZED
//   2. RoundControl[round] must be UNLOCKED
//   3. If an existing Evaluation exists, juryId must match (only original
//      scorer can edit)
//   4. Each metric is 0..10 (validated at the route layer)
//
// Server computes total. Client value is ignored even if present.
// ─────────────────────────────────────────────────────────────────────────────

const ROUND_FIELD = {
  ROUND_1: 'round1State',
  ROUND_2: 'round2State',
  ROUND_3: 'round3State',
};

const EVALUATION_DETAIL = {
  team: {
    select: {
      id: true, name: true,
      domain: { select: { id: true, name: true } },
      problemStatement: { select: { id: true, title: true } },
    },
  },
  jury: { select: { id: true, fullName: true } },
};

const computeTotal = ({ innovation, complexity, presentation, impact, feasibility }) =>
  innovation + complexity + presentation + impact + feasibility;

export const evaluationService = {
  /**
   * Submit (or update) a score. Single transaction:
   *   - re-read team, assignment, round state
   *   - upsert Evaluation with server-computed total
   *   - call leaderboardService.applyScore to patch + re-rank
   * Returns { evaluation, leaderboard }.
   */
  async submit({ teamId, round, juryId, scores, feedback }) {
    return prisma.$transaction(async (tx) => {
      // 1. Team must be FINALIZED.
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: { id: true, status: true },
      });
      if (!team) throw NotFound('Team not found');
      if (team.status !== 'FINALIZED') {
        throw Conflict('Team must be FINALIZED before evaluation');
      }

      // 2. Round must be UNLOCKED — re-check inside tx (race-safe).
      const field = ROUND_FIELD[round];
      const control = await tx.roundControl.findUnique({
        where: { id: 'round_control' },
        select: { [field]: true },
      });
      if (!control) throw NotFound('Round control not initialized');
      if (control[field] !== 'UNLOCKED') {
        throw Conflict('Round is not currently open for scoring', {
          round,
          state: control[field],
        });
      }

      // 3. If a score already exists, only the original jury can edit it.
      // Open-scoring rule: first jury to submit owns the (team, round) slot.
      const existing = await tx.evaluation.findUnique({
        where: { teamId_round: { teamId, round } },
        select: { juryId: true, jury: { select: { fullName: true } } },
      });
      if (existing && existing.juryId !== juryId) {
        throw Conflict('This team has already been scored for this round', {
          scoredBy: existing.jury?.fullName,
        });
      }

      const total = computeTotal(scores);

      const evaluation = await tx.evaluation.upsert({
        where: { teamId_round: { teamId, round } },
        update: {
          juryId, // same juryId — the existing-jury check above guarantees this
          innovation:   scores.innovation,
          complexity:   scores.complexity,
          presentation: scores.presentation,
          impact:       scores.impact,
          feasibility:  scores.feasibility,
          total,
          feedback,
        },
        create: {
          teamId, round, juryId,
          innovation:   scores.innovation,
          complexity:   scores.complexity,
          presentation: scores.presentation,
          impact:       scores.impact,
          feasibility:  scores.feasibility,
          total,
          feedback,
        },
        include: EVALUATION_DETAIL,
      });

      const leaderboard = await leaderboardService.applyScore(tx, {
        teamId,
        round,
        total,
      });

      return { evaluation, leaderboard };
    });
  },

  // ── reads ──────────────────────────────────────────────────────────────

  /** Get a specific (team, round) evaluation, if any. */
  getOne({ teamId, round }) {
    return prisma.evaluation.findUnique({
      where: { teamId_round: { teamId, round } },
      include: EVALUATION_DETAIL,
    });
  },

  /** All scores for a team (across rounds). Admin/jury read view. */
  listForTeam({ teamId }) {
    return prisma.evaluation.findMany({
      where: { teamId },
      include: EVALUATION_DETAIL,
      orderBy: { round: 'asc' },
    });
  },

  /** All scores submitted by a given jury. */
  listForJury({ juryId, round }) {
    return prisma.evaluation.findMany({
      where: { juryId, ...(round && { round }) },
      include: EVALUATION_DETAIL,
      orderBy: [{ round: 'asc' }, { submittedAt: 'desc' }],
    });
  },
};
