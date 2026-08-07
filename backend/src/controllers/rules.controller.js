import { rulesService } from '../services/rules.service.js';
import { auditService } from '../services/audit.service.js';

export const get = async (_req, res) => {
  const rules = await rulesService.get();
  res.json({ rules });
};

export const update = async (req, res) => {
  const { rules, recompute } = await rulesService.update(req.body, req.user.id);

  auditService.record({
    actorId: req.user.id,
    action: 'RULES_UPDATED',
    entityType: 'HackathonRules',
    entityId: rules.id,
    details: { patch: req.body, recompute },
  });

  res.json({ rules, recompute });
};

export const recomputeAll = async (req, res) => {
  const summary = await rulesService.recomputeAll();
  auditService.record({
    actorId: req.user.id,
    action: 'RULES_UPDATED',
    entityType: 'HackathonRules',
    details: { op: 'recomputeAll', summary },
  });
  res.json({ summary });
};
