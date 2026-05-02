import { prisma } from '../config/db.js';
import { Conflict, BadRequest, NotFound } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { rulesService } from './rules.service.js';
import { teamService } from './team.service.js';

// Admin "force resolve" override paths. These bypass:
//   - team.status guards (can edit FINALIZED teams when needed)
//   - rules guards (can finalize unqualified teams)
//
// They DO NOT bypass:
//   - DB unique constraints (TeamMember.userId @unique still applies)
//   - User existence / verification status
//
// Every action sets team.adminOverride = true so the audit trail / UI
// can flag teams that were touched outside the normal flow.

export const teamAdminService = {
  async forceAddMember({ teamId, userId, role = 'MEMBER' }) {
    return prisma.$transaction(async (tx) => {
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      const user = await membershipService.loadUserOrThrow(tx, userId);
      const rules = await rulesService.get(tx);

      // Bend maxTeamSize: admin override may exceed soft cap, but we still
      // refuse to insert a duplicate user via the unique constraint.
      // Counter still bumps; the team will fail rules.qualifies() afterwards
      // if size exceeds maxTeamSize, and the admin will see that in the UI.
      await membershipService.addMember(tx, {
        team,
        user,
        role,
        maxTeamSize: Math.max(rules.maxTeamSize, team.memberCount + 1),
        allowFinalized: true,
      });

      await tx.team.update({
        where: { id: teamId },
        data: { adminOverride: true },
      });

      return tx.team.findUnique({ where: { id: teamId }, include: teamService.detailInclude });
    });
  },

  async forceRemoveMember({ teamId, userId }) {
    return prisma.$transaction(async (tx) => {
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.leaderId === userId) {
        throw BadRequest('Use disbandTeam to remove the leader');
      }
      await membershipService.removeMember(tx, { teamId, userId, allowFinalized: true });
      await tx.team.update({ where: { id: teamId }, data: { adminOverride: true } });
      return tx.team.findUnique({ where: { id: teamId }, include: teamService.detailInclude });
    });
  },

  async disbandTeam({ teamId }) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: { id: true, leaderId: true },
      });
      if (!team) throw NotFound('Team not found');
      // Cascade wipes members/invites/requests/etc.
      await tx.team.delete({ where: { id: teamId } });
      return { disbanded: true, teamId };
    });
  },

  /**
   * Force a team into FINALIZED regardless of rule satisfaction. Records
   * the override flag and a snapshot of which rules were unmet at the
   * moment of override (kept in adminOverride flag + audit).
   */
  async forceFinalize({ teamId }) {
    return prisma.$transaction(async (tx) => {
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      if (team.status === 'FINALIZED') throw Conflict('Team is already finalized');
      if (team.status === 'DISQUALIFIED') throw Conflict('Team is disqualified');

      const rules = await rulesService.get(tx);
      const unmet = rulesService.unmetReasons(team, rules);

      // Cancel still-open invites + join requests (same as leader finalize).
      await tx.teamInvite.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      });
      await tx.joinRequest.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      });

      const updated = await tx.team.update({
        where: { id: teamId },
        data: {
          status: 'FINALIZED',
          finalizedAt: new Date(),
          adminOverride: true,
        },
        include: teamService.detailInclude,
      });

      // Return unmet so the controller can audit-log it.
      return { team: updated, unmetAtOverride: unmet };
    });
  },

  async setStatus({ teamId, status }) {
    if (!['FORMING', 'QUALIFIED', 'FINALIZED', 'DISQUALIFIED'].includes(status)) {
      throw BadRequest('Invalid status');
    }
    return prisma.team.update({
      where: { id: teamId },
      data: {
        status,
        adminOverride: true,
        ...(status === 'FINALIZED' && { finalizedAt: new Date() }),
      },
      include: teamService.detailInclude,
    });
  },

  async recount({ teamId }) {
    return prisma.$transaction(async (tx) => {
      return membershipService.recountTeam(tx, teamId);
    });
  },
};
