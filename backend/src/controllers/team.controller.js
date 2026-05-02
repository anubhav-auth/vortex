import { teamService } from '../services/team.service.js';
import { auditService } from '../services/audit.service.js';
import { NotFound } from '../utils/errors.js';

export const create = async (req, res) => {
  const team = await teamService.create({
    name:     req.body.name,
    domainId: req.body.domainId,
    psId:     req.body.psId,
    leaderId: req.user.id,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_CREATED',
    entityType: 'Team', entityId: team.id, details: { name: team.name },
  });
  res.status(201).json({ team });
};

export const get = async (req, res) => {
  const team = await teamService.get(req.params.id);
  if (!team) throw NotFound('Team not found');
  res.json({ team });
};

export const list = async (req, res) => {
  const teams = await teamService.list(req.query);
  res.json({ count: teams.length, teams });
};

export const listJoinable = async (req, res) => {
  const teams = await teamService.listJoinable(req.query);
  res.json({ count: teams.length, teams });
};

export const finalize = async (req, res) => {
  const team = await teamService.finalize({
    teamId:  req.params.id,
    actorId: req.user.id,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FINALIZED',
    entityType: 'Team', entityId: team.id,
  });
  res.json({ team });
};
