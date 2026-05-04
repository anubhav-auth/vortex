import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { rulesService } from './rules.service.js';

// User → team join requests.

export const joinRequestService = {
  /**
   * User asks to join a team. Refuses if:
   * - team is FINALIZED / DISQUALIFIED / full
   * - user already in any team
   * - duplicate live request (via JoinRequest @@unique([teamId, requesterId]))
   */
  async create({ teamId, requesterId }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.status === 'FINALIZED') throw Conflict('Team is finalized');
      if (team.status === 'DISQUALIFIED') throw Conflict('Team is disqualified');

      const rules = await rulesService.get(tx);
      if (team.memberCount >= rules.maxTeamSize) throw Conflict('Team is full');

      const requester = await membershipService.loadUserOrThrow(tx, requesterId);
      if (requester.role !== 'STUDENT') throw Forbidden('Only students can request to join');
      if (requester.verificationStatus !== 'VERIFIED') {
        throw Forbidden('Account is not verified');
      }

      const existingMembership = await tx.teamMember.findUnique({
        where: { userId: requesterId },
        select: { teamId: true },
      });
      if (existingMembership) throw Conflict('You are already in a team');

      const existing = await tx.joinRequest.findUnique({
        where: { teamId_requesterId: { teamId, requesterId } },
      });
      if (existing && existing.status === 'PENDING') {
        throw Conflict('Join request already pending');
      }

      try {
        if (existing) {
          return await tx.joinRequest.update({
            where: { id: existing.id },
            data: { status: 'PENDING', respondedAt: null, createdAt: new Date() },
          });
        }
        return await tx.joinRequest.create({
          data: { teamId, requesterId, status: 'PENDING' },
        });
      } catch (err) {
        if (err.code === 'P2002') throw Conflict('Join request already exists');
        throw err;
      }
    });
  },

  /**
   * Leader approves a join request. Transactional. Delegates to addMember,
   * which auto-cancels the requester's other pending invites + requests.
   */
  async approve({ requestId, actorId }) {
    return prisma.$transaction(async (tx) => {
      const req = await tx.joinRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true, teamId: true, requesterId: true, status: true,
          team: { select: { leaderId: true } },
        },
      });
      if (!req) throw NotFound('Join request not found');
      if (req.team.leaderId !== actorId) throw Forbidden('Only the leader can approve requests');
      if (req.status !== 'PENDING') {
        throw Conflict('Request is no longer pending', { status: req.status });
      }

      const team = await membershipService.loadTeamForUpdate(tx, req.teamId);
      const user = await membershipService.loadUserOrThrow(tx, req.requesterId);
      const rules = await rulesService.get(tx);

      await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', respondedAt: new Date() },
      });

      await membershipService.addMember(tx, {
        team,
        user,
        role: 'MEMBER',
        maxTeamSize: rules.maxTeamSize,
      });

      return tx.team.findUnique({ where: { id: team.id }, include: { members: true } });
    });
  },

  async deny({ requestId, actorId }) {
    const req = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, team: { select: { leaderId: true } } },
    });
    if (!req) throw NotFound('Join request not found');
    if (req.team.leaderId !== actorId) throw Forbidden('Only the leader can deny requests');
    if (req.status !== 'PENDING') {
      throw Conflict('Request is no longer pending', { status: req.status });
    }
    return prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'DENIED', respondedAt: new Date() },
    });
  },

  /** Requester cancels their own pending request. */
  async cancel({ requestId, actorId }) {
    const req = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, requesterId: true },
    });
    if (!req) throw NotFound('Join request not found');
    if (req.requesterId !== actorId) throw Forbidden('Not your request');
    if (req.status !== 'PENDING') {
      throw Conflict('Request is no longer pending', { status: req.status });
    }
    return prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });
  },

  listForUser(userId) {
    return prisma.joinRequest.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: {
        team: {
          select: {
            id: true, name: true,
            domain: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  listForTeam({ teamId, status }) {
    return prisma.joinRequest.findMany({
      where: { teamId, ...(status && { status }) },
      include: {
        requester: {
          select: {
            id: true, fullName: true, email: true,
            isDomainExpert: true, gender: true,
            domain: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
