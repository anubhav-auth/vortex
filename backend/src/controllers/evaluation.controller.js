import { evaluationService } from '../services/evaluation.service.js';
import { auditService } from '../services/audit.service.js';

export const submit = async (req, res) => {
  const result = await evaluationService.submit({
    teamId:   req.body.teamId,
    round:    req.body.round,
    juryId:   req.user.id,
    scores:   req.body.scores,
    feedback: req.body.feedback,
  });

  auditService.record({
    actorId: req.user.id,
    action:  'SCORE_SUBMITTED',
    entityType: 'Evaluation',
    entityId: result.evaluation.id,
    details: { teamId: req.body.teamId, round: req.body.round, total: result.evaluation.total },
  });

  res.status(201).json(result);
};

export const teamScores = async (req, res) => {
  const evaluations = await evaluationService.listForTeam({ teamId: req.params.id });
  res.json({ count: evaluations.length, evaluations });
};

export const myEvaluations = async (req, res) => {
  const evaluations = await evaluationService.listForJury({
    juryId: req.user.id,
    round:  req.query.round,
  });
  res.json({ count: evaluations.length, evaluations });
};
