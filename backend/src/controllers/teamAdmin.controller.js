import { teamAdminService } from '../services/teamAdmin.service.js';
import { auditService } from '../services/audit.service.js';

export const forceAddMember = async (req, res) => {
  const team = await teamAdminService.forceAddMember({
    teamId: req.params.id,
    userId: req.body.userId,
    role:   req.body.role,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: team.id,
    details: { op: 'forceAddMember', userId: req.body.userId },
  });
  res.json({ team });
};

export const forceRemoveMember = async (req, res) => {
  const team = await teamAdminService.forceRemoveMember({
    teamId: req.params.id,
    userId: req.body.userId,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: team.id,
    details: { op: 'forceRemoveMember', userId: req.body.userId },
  });
  res.json({ team });
};

export const disbandTeam = async (req, res) => {
  const result = await teamAdminService.disbandTeam({ teamId: req.params.id });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: req.params.id,
    details: { op: 'disband' },
  });
  res.json(result);
};

export const forceFinalize = async (req, res) => {
  const { team, unmetAtOverride } = await teamAdminService.forceFinalize({ teamId: req.params.id });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FINALIZED',
    entityType: 'Team', entityId: team.id,
    details: { override: true, unmetAtOverride },
  });
  res.json({ team, unmetAtOverride });
};

export const setStatus = async (req, res) => {
  const team = await teamAdminService.setStatus({
    teamId: req.params.id,
    status: req.body.status,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: team.id,
    details: { op: 'setStatus', status: req.body.status },
  });
  res.json({ team });
};

export const recount = async (req, res) => {
  const counters = await teamAdminService.recount({ teamId: req.params.id });
  res.json({ counters });
};
