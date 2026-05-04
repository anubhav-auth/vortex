import { z } from 'zod';

const cuid = z.string().cuid();
const round = z.enum(['ROUND_1', 'ROUND_2', 'ROUND_3']);
const score = z.coerce.number().int().min(0).max(10);

// ── jury assignment
export const createAssignmentSchema = z.object({
  teamId: cuid,
  round,
  juryId: cuid,
});

export const reassignAssignmentSchema = z.object({
  teamId: cuid,
  round,
  juryId: cuid,
});

export const assignmentIdParamSchema = z.object({ id: cuid });

export const listAssignmentsQuerySchema = z.object({
  round:  round.optional(),
  juryId: cuid.optional(),
});

// ── jury read
export const myAssignmentsQuerySchema = z.object({
  round: round.optional(),
});

// ── evaluation submit
export const submitEvaluationSchema = z.object({
  teamId: cuid,
  round,
  scores: z.object({
    innovation:   score,
    complexity:   score,
    presentation: score,
    impact:       score,
    feasibility:  score,
  }),
  feedback: z.string().trim().max(2000).optional(),
});

// ── evaluation read
export const teamScoresParamSchema = z.object({ id: cuid });

// ── round control
export const setRoundStateSchema = z.object({
  round,
  state: z.enum(['LOCKED', 'UNLOCKED', 'CLOSED']),
});

// ── leaderboard
export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
