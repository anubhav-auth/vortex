import { roundControlService } from '../services/roundControl.service.js';
import { auditService } from '../services/audit.service.js';

export const get = async (_req, res) => {
  const control = await roundControlService.get();
  res.json({ control });
};

export const setRoundState = async (req, res) => {
  const control = await roundControlService.setRoundState({
    round: req.body.round,
    state: req.body.state,
    actorId: req.user.id,
  });

  auditService.record({
    actorId: req.user.id,
    action:  'ROUND_STATE_CHANGED',
    entityType: 'RoundControl',
    entityId: control.id,
    details: { round: req.body.round, state: req.body.state },
  });

  res.json({ control });
};
