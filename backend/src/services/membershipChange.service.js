import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { rulesService } from './rules.service.js';

// DUAL-APPROVAL WORKFLOW ENGINE
//
//   Action      Initiator   Approver
//   LEAVE       member      leader
//   DISMISS     leader      member (the one being dismissed)
//   DISBAND     leader      every non-leader member
//
// State machine:
//   LEAVE / DISMISS  PENDING -> EXECUTED | DENIED | CANCELLED
//   DISBAND          PENDING -> APPROVED -> EXECUTED
//                                  |          ^
//                                  +-> DENIED-+
//                                  +-> CANCELLED
//
// A DISBAND request is represented as one row per non-leader approver.
// The team is deleted only after the final pending approver has approved.

const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];

const loadMembership = async (tx, { teamId, userId }) => {
  const member = await tx.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  if (!member) throw NotFound('User is not a member of this team');
  return member;
};

const assertNoActiveTeamDisband = async (tx, teamId) => {
  const active = await tx.membershipChangeRequest.findFirst({
    where: { teamId, kind: 'DISBAND', status: { in: ACTIVE_STATUSES } },
    select: { id: true },
  });
  if (active) throw Conflict('Team dissolution approval is already in progress');
};

export const membershipChangeService = {
  assertNoActiveTeamDisband,

  /**
   * Member initiates a LEAVE request. Leader must approve.
   * Disallowed if team is FINALIZED or a dissolve workflow is active.
   */
  async requestLeave({ teamId, userId, reason }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      await assertNoActiveTeamDisband(tx, teamId);
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
   * acknowledge (approve). Disallowed if team is FINALIZED or dissolving.
   */
  async requestDismiss({ teamId, leaderId, targetUserId, reason }) {
    if (leaderId === targetUserId) throw BadRequest('Cannot dismiss yourself');

    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      await assertNoActiveTeamDisband(tx, teamId);
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
   * Leader initiates a DISBAND request. Every non-leader member receives
   * an approval task. If there are no other members, the team is removed
   * immediately.
   */
  async requestDisband({ teamId, leaderId, reason }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.leaderId !== leaderId) throw Forbidden('Only the team leader can dissolve the team');
      if (team.status === 'FINALIZED') throw Conflict('Finalized teams cannot be dissolved');
      if (team.status === 'DISQUALIFIED') throw Conflict('Disqualified teams cannot be dissolved');

      await assertNoActiveTeamDisband(tx, teamId);

      const approvers = await tx.teamMember.findMany({
        where: { teamId, NOT: { userId: leaderId } },
        select: { userId: true },
      });

      if (approvers.length === 0) {
        await tx.team.delete({ where: { id: teamId } });
        return {
          disbanded: true,
          requested: false,
          teamId,
          approvalsRequired: 0,
          pendingApprovals: 0,
        };
      }

      const now = new Date();

      // Freeze the team at the workflow boundary so no new invites / joins /
      // member removals continue while dissolution approvals are outstanding.
      await tx.teamInvite.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: now },
      });
      await tx.joinRequest.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: now },
      });
      await tx.membershipChangeRequest.updateMany({
        where: {
          teamId,
          kind: { in: ['LEAVE', 'DISMISS'] },
          status: { in: ACTIVE_STATUSES },
        },
        data: { status: 'CANCELLED', resolvedAt: now },
      });

      await tx.membershipChangeRequest.createMany({
        data: approvers.map(({ userId }) => ({
          teamId,
          kind: 'DISBAND',
          targetUserId: userId,
          initiatorId: leaderId,
          approverId: userId,
          status: 'PENDING',
          reason,
        })),
      });

      return {
        disbanded: false,
        requested: true,
        teamId,
        approvalsRequired: approvers.length,
        pendingApprovals: approvers.length,
      };
    });
  },

  /**
   * The approver accepts.
   * - LEAVE / DISMISS: execute the membership removal immediately.
   * - DISBAND: mark this member approved; once every member has approved,
   *   the team itself is deleted.
   */
  async approve({ requestId, actorId }) {
    return prisma.$transaction(async (tx) => {
      const change = await tx.membershipChangeRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          teamId: true,
          kind: true,
          targetUserId: true,
          approverId: true,
          initiatorId: true,
          status: true,
          reason: true,
          createdAt: true,
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

      if (change.kind === 'DISBAND') {
        if (change.team.status === 'FINALIZED') {
          throw Conflict('Finalized teams cannot be dissolved');
        }
        if (change.team.status === 'DISQUALIFIED') {
          throw Conflict('Disqualified teams cannot be dissolved');
        }

        const approved = await tx.membershipChangeRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        const approvalsPending = await tx.membershipChangeRequest.count({
          where: {
            teamId: change.teamId,
            kind: 'DISBAND',
            initiatorId: change.initiatorId,
            status: 'PENDING',
          },
        });

        if (approvalsPending > 0) {
          return { change: approved, disbanded: false, approvalsPending };
        }

        const resolvedAt = new Date();
        await tx.membershipChangeRequest.updateMany({
          where: {
            teamId: change.teamId,
            kind: 'DISBAND',
            initiatorId: change.initiatorId,
            status: { in: ACTIVE_STATUSES },
          },
          data: { status: 'EXECUTED', resolvedAt },
        });
        await tx.team.delete({ where: { id: change.teamId } });

        return {
          change: {
            ...approved,
            status: 'EXECUTED',
            resolvedAt,
          },
          disbanded: true,
          approvalsPending: 0,
          teamId: change.teamId,
        };
      }

      if (change.team.status === 'FINALIZED') {
        throw Conflict('Team is finalized; membership cannot change');
      }

      await membershipService.removeMember(tx, {
        teamId: change.teamId,
        userId: change.targetUserId,
      });

      await tx.membershipChangeRequest.updateMany({
        where: {
          teamId: change.teamId,
          targetUserId: change.targetUserId,
          status: { in: ACTIVE_STATUSES },
          NOT: { id: requestId },
        },
        data: { status: 'CANCELLED', resolvedAt: new Date() },
      });

      const executed = await tx.membershipChangeRequest.update({
        where: { id: requestId },
        data: { status: 'EXECUTED', resolvedAt: new Date() },
      });

      return { change: executed, disbanded: false };
    });
  },

  async deny({ requestId, actorId }) {
    return prisma.$transaction(async (tx) => {
      const change = await tx.membershipChangeRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          approverId: true,
          status: true,
          kind: true,
          teamId: true,
          initiatorId: true,
        },
      });
      if (!change) throw NotFound('Change request not found');
      if (change.approverId !== actorId) {
        throw Forbidden('You are not the approver for this request');
      }
      if (change.status !== 'PENDING') {
        throw Conflict('Request is no longer pending', { status: change.status });
      }

      const resolvedAt = new Date();

      if (change.kind === 'DISBAND') {
        await tx.membershipChangeRequest.updateMany({
          where: {
            teamId: change.teamId,
            kind: 'DISBAND',
            initiatorId: change.initiatorId,
            status: { in: ACTIVE_STATUSES },
            NOT: { id: requestId },
          },
          data: { status: 'CANCELLED', resolvedAt },
        });
      }

      const denied = await tx.membershipChangeRequest.update({
        where: { id: requestId },
        data: { status: 'DENIED', resolvedAt },
      });

      return { change: denied, disbanded: false };
    });
  },

  /** Initiator can withdraw their own pending request. */
  async cancel({ requestId, actorId }) {
    return prisma.$transaction(async (tx) => {
      const change = await tx.membershipChangeRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          initiatorId: true,
          status: true,
          kind: true,
          teamId: true,
        },
      });
      if (!change) throw NotFound('Change request not found');
      if (change.initiatorId !== actorId) {
        throw Forbidden('Only the initiator can cancel');
      }
      if (change.status !== 'PENDING' && change.status !== 'APPROVED') {
        throw Conflict('Request is no longer active', { status: change.status });
      }

      const resolvedAt = new Date();

      if (change.kind === 'DISBAND') {
        await tx.membershipChangeRequest.updateMany({
          where: {
            teamId: change.teamId,
            kind: 'DISBAND',
            initiatorId: actorId,
            status: { in: ACTIVE_STATUSES },
          },
          data: { status: 'CANCELLED', resolvedAt },
        });

        return {
          change: {
            ...change,
            status: 'CANCELLED',
            resolvedAt,
          },
          disbanded: false,
        };
      }

      const cancelled = await tx.membershipChangeRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED', resolvedAt },
      });

      return { change: cancelled, disbanded: false };
    });
  },

  // Read views split by the actor's perspective on the queue.
  listAwaitingMyApproval(userId) {
    return prisma.membershipChangeRequest.findMany({
      where: { approverId: userId, status: { in: ACTIVE_STATUSES } },
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
