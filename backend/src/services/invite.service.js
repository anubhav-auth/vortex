import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { membershipChangeService } from './membershipChange.service.js';
import { rulesService } from './rules.service.js';

// Leader → user invitations.

export const inviteService = {
  /**
   * Leader invites a user. Refuses if:
   * - actor is not the team's leader
   * - team is FINALIZED / DISQUALIFIED / full
   * - invitee already in any team (via TeamMember.userId @unique)
   * - duplicate live invite (via TeamInvite @@unique([teamId, inviteeId]))
   */
  async create({ teamId, inviterId, inviteeId }) {
    if (inviterId === inviteeId) throw BadRequest('Cannot invite yourself');

    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      await membershipChangeService.assertNoActiveTeamDisband(tx, teamId);
      if (team.leaderId !== inviterId) throw Forbidden('Only the team leader can invite');
      if (team.status === 'FINALIZED') throw Conflict('Team is finalized');
      if (team.status === 'DISQUALIFIED') throw Conflict('Team is disqualified');

      const rules = await rulesService.get(tx);
      if (team.memberCount >= rules.maxTeamSize) throw Conflict('Team is full');

      const invitee = await membershipService.loadUserOrThrow(tx, inviteeId);
      if (invitee.role !== 'STUDENT') throw Forbidden('Can only invite students');
      if (invitee.verificationStatus !== 'VERIFIED') {
        throw Forbidden('Invitee is not verified');
      }

      // Cheap pre-check for clearer error message; the unique constraint
      // is still authoritative.
      const existingMembership = await tx.teamMember.findUnique({
        where: { userId: inviteeId },
        select: { teamId: true },
      });
      if (existingMembership) throw Conflict('User is already in a team');

      // Refresh existing CANCELLED/DECLINED row instead of leaving stale rows
      // around. Composite unique on (teamId, inviteeId) prevents duplicate
      // PENDING from racing.
      const existing = await tx.teamInvite.findUnique({
        where: { teamId_inviteeId: { teamId, inviteeId } },
      });
      if (existing && existing.status === 'PENDING') {
        throw Conflict('Invite already pending for this user');
      }

      try {
        if (existing) {
          return await tx.teamInvite.update({
            where: { id: existing.id },
            data: {
              inviterId,
              status: 'PENDING',
              respondedAt: null,
              createdAt: new Date(),
            },
          });
        }
        return await tx.teamInvite.create({
          data: { teamId, inviterId, inviteeId, status: 'PENDING' },
        });
      } catch (err) {
        if (err.code === 'P2002') throw Conflict('Invite already exists');
        throw err;
      }
    });
  },

  /**
   * Invitee accepts. Transactional — reads invite + team inside tx, calls
   * the central addMember, lets unique constraints enforce safety.
   */
  async accept({ inviteId, userId }) {
    return prisma.$transaction(async (tx) => {
      const invite = await tx.teamInvite.findUnique({
        where: { id: inviteId },
        select: { id: true, teamId: true, inviteeId: true, status: true },
      });
      if (!invite) throw NotFound('Invite not found');
      if (invite.inviteeId !== userId) throw Forbidden('Not your invite');
      if (invite.status !== 'PENDING') {
        throw Conflict('Invite is no longer pending', { status: invite.status });
      }

      const team = await membershipService.loadTeamForUpdate(tx, invite.teamId);
      const user = await membershipService.loadUserOrThrow(tx, userId);
      const rules = await rulesService.get(tx);

      // Mark this invite ACCEPTED first so cancelOtherPendingForUser inside
      // addMember (which excludes only by teamId) doesn't accidentally
      // cancel us before we flip status.
      await tx.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
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

  async decline({ inviteId, userId }) {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      select: { id: true, inviteeId: true, status: true },
    });
    if (!invite) throw NotFound('Invite not found');
    if (invite.inviteeId !== userId) throw Forbidden('Not your invite');
    if (invite.status !== 'PENDING') {
      throw Conflict('Invite is no longer pending', { status: invite.status });
    }
    return prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'DECLINED', respondedAt: new Date() },
    });
  },

  /** Leader cancels an outgoing invite. */
  async cancel({ inviteId, actorId }) {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      select: { id: true, status: true, team: { select: { leaderId: true } } },
    });
    if (!invite) throw NotFound('Invite not found');
    if (invite.team.leaderId !== actorId) throw Forbidden('Only the leader can cancel invites');
    if (invite.status !== 'PENDING') {
      throw Conflict('Invite is no longer pending', { status: invite.status });
    }
    return prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });
  },

  listForUser(userId) {
    return prisma.teamInvite.findMany({
      where: { inviteeId: userId, status: 'PENDING' },
      include: {
        team: {
          select: {
            id: true, name: true, memberCount: true,
            domain: { select: { id: true, name: true } },
            problemStatement: { select: { id: true, title: true } },
            leader: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  listForTeam({ teamId, status }) {
    return prisma.teamInvite.findMany({
      where: { teamId, ...(status && { status }) },
      include: { invitee: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
