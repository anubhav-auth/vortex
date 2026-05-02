import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { juryAssignmentService } from './juryAssignment.service.js';
import { leaderboardService } from './leaderboard.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION
//
// Score upsert with a strict authorization chain. Every guard is re-checked
// inside the transaction so race conditions (admin reopens/closes a round
// while a jury is mid-submit) cannot land bad data.
//
// Scoring guards (in order):
//   1. Team must be FINALIZED
//   2. JuryAssignment(teamId, round) must exist and belong to this jury
//   3. RoundControl[round] must be UNLOCKED
//      (route layer also blocks via requireRoundUnlocked; service is the
//       authoritative re-check)
//   4. Each metric is 0..10 (validated at the route layer; service trusts
//      the parsed body)
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

      // 2. Assignment must match this jury.
      await juryAssignmentService.assertAssigned(tx, { teamId, round, juryId });

      // 3. Round must be UNLOCKED — re-check inside tx (race-safe).
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

      const total = computeTotal(scores);

      const evaluation = await tx.evaluation.upsert({
        where: { teamId_round: { teamId, round } },
        update: {
          juryId, // stays the same as the assignment's jury
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
