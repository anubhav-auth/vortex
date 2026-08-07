import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// JURY ASSIGNMENT
//
// Pre-allocation gate: admin assigns (team, round) → jury. Once assigned,
// only that jury can submit a score for that team/round.
//
// DB invariants:
//   @@unique([teamId, round])         → one jury per team per round
//   @@unique([juryId, teamId, round]) → safety-net dup-key guard
// ─────────────────────────────────────────────────────────────────────────────

const ASSIGNMENT_INCLUDE = {
  team: {
    select: {
      id: true, name: true, status: true,
      domain: { select: { id: true, name: true } },
      problemStatement: { select: { id: true, title: true } },
    },
  },
  jury: { select: { id: true, fullName: true, email: true } },
};

export const juryAssignmentService = {
  /**
   * Assign a jury to a team for a round. Refuses if:
   * - team / jury don't exist
   * - jury role isn't JURY
   * - team is not FINALIZED (we only score finalized teams)
   * - another jury is already assigned to (team, round)
   */
  async create({ teamId, round, juryId }) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: { id: true, status: true },
      });
      if (!team) throw NotFound('Team not found');
      if (team.status !== 'FINALIZED') {
        throw Conflict('Team must be FINALIZED before assigning a jury');
      }

      const jury = await tx.user.findUnique({
        where: { id: juryId },
        select: { id: true, role: true },
      });
      if (!jury) throw NotFound('Jury not found');
      if (jury.role !== 'JURY') throw Forbidden('User is not a jury');

      try {
        return await tx.juryAssignment.create({
          data: { teamId, round, juryId },
          include: ASSIGNMENT_INCLUDE,
        });
      } catch (err) {
        if (err.code === 'P2002') {
          throw Conflict('A jury is already assigned to this team for this round');
        }
        throw err;
      }
    });
  },

  /**
   * Reassign — explicit op so the admin sees what's happening. Deletes
   * the existing assignment (if any) and creates the new one in one tx.
   * Refuses if an Evaluation already exists for (team, round) — score
   * data must not be orphaned by changing assignees.
   */
  async reassign({ teamId, round, juryId }) {
    return prisma.$transaction(async (tx) => {
      const evalExists = await tx.evaluation.findUnique({
        where: { teamId_round: { teamId, round } },
        select: { id: true },
      });
      if (evalExists) {
        throw Conflict('Cannot reassign — an evaluation already exists for this team and round');
      }

      const jury = await tx.user.findUnique({
        where: { id: juryId },
        select: { id: true, role: true },
      });
      if (!jury) throw NotFound('Jury not found');
      if (jury.role !== 'JURY') throw Forbidden('User is not a jury');

      await tx.juryAssignment.deleteMany({ where: { teamId, round } });
      return tx.juryAssignment.create({
        data: { teamId, round, juryId },
        include: ASSIGNMENT_INCLUDE,
      });
    });
  },

  async remove({ assignmentId }) {
    const assignment = await prisma.juryAssignment.findUnique({
      where: { id: assignmentId },
      select: { teamId: true, round: true },
    });
    if (!assignment) throw NotFound('Assignment not found');

    const evalExists = await prisma.evaluation.findUnique({
      where: { teamId_round: { teamId: assignment.teamId, round: assignment.round } },
      select: { id: true },
    });
    if (evalExists) {
      throw Conflict('Cannot remove — an evaluation already exists for this team and round');
    }

    await prisma.juryAssignment.delete({ where: { id: assignmentId } });
    return { removed: true };
  },

  /**
   * Verify a jury is the assigned scorer for (teamId, round). Returns the
   * assignment row or throws 403. Caller may pass a tx for in-txn checks.
   */
  async assertAssigned(tx, { teamId, round, juryId }) {
    const client = tx ?? prisma;
    const assignment = await client.juryAssignment.findUnique({
      where: { teamId_round: { teamId, round } },
      select: { id: true, juryId: true },
    });
    if (!assignment) throw Forbidden('No jury is assigned to this team for this round');
    if (assignment.juryId !== juryId) {
      throw Forbidden('You are not the assigned jury for this team and round');
    }
    return assignment;
  },

  // ── reads ──────────────────────────────────────────────────────────────
  listForJury({ juryId, round }) {
    return prisma.juryAssignment.findMany({
      where: { juryId, ...(round && { round }) },
      include: ASSIGNMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  },

  listForTeam({ teamId }) {
    return prisma.juryAssignment.findMany({
      where: { teamId },
      include: ASSIGNMENT_INCLUDE,
      orderBy: { round: 'asc' },
    });
  },

  list({ round, juryId } = {}) {
    return prisma.juryAssignment.findMany({
      where: { ...(round && { round }), ...(juryId && { juryId }) },
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    });
  },
};
