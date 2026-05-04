import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { rulesService } from './rules.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-APPROVAL WORKFLOW ENGINE
//
//   Action      Initiator   Approver
//   LEAVE       member      leader
//   DISMISS     leader      member (the one being dismissed)
//
// State machine: PENDING → (APPROVED → EXECUTED) | DENIED | CANCELLED
//
// EXECUTED is set ONLY after the membership row is actually deleted, inside
// the same transaction. APPROVED is a transient state that should not occur
// outside the approve() transaction; we still model it for correctness in
// case future flows separate "approve" from "execute" (e.g. with a delay).
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];

const loadMembership = async (tx, { teamId, userId }) => {
  const member = await tx.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  if (!member) throw NotFound('User is not a member of this team');
  return member;
};

export const membershipChangeService = {
  /**
   * Member initiates a LEAVE request. Leader must approve.
   * Disallowed if team is FINALIZED.
   */
  async requestLeave({ teamId, userId, reason }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.status === 'FINALIZED') {
        throw Conflict('Team is finalized; membership cannot change');
      }
      if (team.leaderId === userId) {
        throw BadRequest('Leaders cannot leave; transfer leadership or disband');
      }

      const member = await loadMembership(tx, { teamId, userId });
      if (member.role === 'LEADER') {
        throw BadRequest('Leaders cannot leave; transfer leadership or disband');
      }

      // One open change request per (target, team) at a time. Reject if
      // there's already a PENDING/APPROVED row for this user on this team.
      const existing = await tx.membershipChangeRequest.findFirst({
        where: { teamId, targetUserId: userId, status: { in: ACTIVE_STATUSES } },
      });
      if (existing) throw Conflict('A membership change request is already in progress');

      return tx.membershipChangeRequest.create({
        data: {
          teamId,
          kind: 'LEAVE',
          targetUserId: userId,
          initiatorId: userId,
          approverId: team.leaderId,
          status: 'PENDING',
          reason,
        },
      });
    });
  },

  /**
   * Leader initiates a DISMISS request against a member. Member must
   * acknowledge (approve). Disallowed if team is FINALIZED.
   */
  async requestDismiss({ teamId, leaderId, targetUserId, reason }) {
    if (leaderId === targetUserId) throw BadRequest('Cannot dismiss yourself');

    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.status === 'FINALIZED') {
        throw Conflict('Team is finalized; membership cannot change');
      }
      if (team.leaderId !== leaderId) throw Forbidden('Only the team leader can dismiss');

      const member = await loadMembership(tx, { teamId, userId: targetUserId });
      if (member.role === 'LEADER') throw BadRequest('Cannot dismiss the leader');

      const existing = await tx.membershipChangeRequest.findFirst({
        where: { teamId, targetUserId, status: { in: ACTIVE_STATUSES } },
      });
      if (existing) throw Conflict('A membership change request is already in progress');

      return tx.membershipChangeRequest.create({
        data: {
          teamId,
          kind: 'DISMISS',
          targetUserId,
          initiatorId: leaderId,
          approverId: targetUserId,
          status: 'PENDING',
          reason,
        },
      });
    });
  },

  /**
   * The approver accepts. EXECUTES the membership removal in the same
   * transaction. Status goes PENDING → EXECUTED (we skip the standalone
   * APPROVED state since approve+execute happen together).
   */
  async approve({ requestId, actorId }) {
    return prisma.$transaction(async (tx) => {
      const change = await tx.membershipChangeRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true, teamId: true, kind: true,
          targetUserId: true, approverId: true, status: true,
          team: { select: { status: true, leaderId: true } },
        },
      });
      if (!change) throw NotFound('Change request not found');
      if (change.approverId !== actorId) {
        throw Forbidden('You are not the approver for this request');
      }
      if (change.status !== 'PENDING') {
        throw Conflict('Request is no longer pending', { status: change.status });
      }
      if (change.team.status === 'FINALIZED') {
        // Snapshot guard: even if the team was finalized after the request
        // was filed, the removal cannot proceed.
        throw Conflict('Team is finalized; membership cannot change');
      }

      await membershipService.removeMember(tx, {
        teamId: change.teamId,
        userId: change.targetUserId,
      });

      // Cancel any other open change requests targeting this same user on
      // this team (defensive — we've already enforced 1-active above).
      await tx.membershipChangeRequest.updateMany({
        where: {
          teamId: change.teamId,
          targetUserId: change.targetUserId,
          status: { in: ACTIVE_STATUSES },
          NOT: { id: requestId },
        },
        data: { status: 'CANCELLED', resolvedAt: new Date() },
      });

      return tx.membershipChangeRequest.update({
        where: { id: requestId },
        data: { status: 'EXECUTED', resolvedAt: new Date() },
      });
    });
  },

  async deny({ requestId, actorId }) {
    const change = await prisma.membershipChangeRequest.findUnique({
      where: { id: requestId },
      select: { id: true, approverId: true, status: true },
    });
    if (!change) throw NotFound('Change request not found');
    if (change.approverId !== actorId) {
      throw Forbidden('You are not the approver for this request');
    }
    if (change.status !== 'PENDING') {
      throw Conflict('Request is no longer pending', { status: change.status });
    }
    return prisma.membershipChangeRequest.update({
      where: { id: requestId },
      data: { status: 'DENIED', resolvedAt: new Date() },
    });
  },

  /** Initiator can withdraw their own pending request. */
  async cancel({ requestId, actorId }) {
    const change = await prisma.membershipChangeRequest.findUnique({
      where: { id: requestId },
      select: { id: true, initiatorId: true, status: true },
    });
    if (!change) throw NotFound('Change request not found');
    if (change.initiatorId !== actorId) {
      throw Forbidden('Only the initiator can cancel');
    }
    if (change.status !== 'PENDING') {
      throw Conflict('Request is no longer pending', { status: change.status });
    }
    return prisma.membershipChangeRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', resolvedAt: new Date() },
    });
  },

  // Read views — split by the actor's perspective on the queue.
  listAwaitingMyApproval(userId) {
    return prisma.membershipChangeRequest.findMany({
      where: { approverId: userId, status: 'PENDING' },
      include: {
        team: { select: { id: true, name: true } },
        target: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  listInitiatedByMe(userId) {
    return prisma.membershipChangeRequest.findMany({
      where: { initiatorId: userId, status: { in: ACTIVE_STATUSES } },
      include: {
        team: { select: { id: true, name: true } },
        target: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
