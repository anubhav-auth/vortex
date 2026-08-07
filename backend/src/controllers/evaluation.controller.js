import { evaluationService } from '../services/evaluation.service.js';
import { auditService } from '../services/audit.service.js';
import { prisma } from '../config/db.js';

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

// Jury "scoring board": every FINALIZED team with the per-round score that
// already exists (if any). Powers the open-scoring UI so juries can see at
// a glance which (team, round) slots are still up for grabs and which are
// owned. Includes the scorer's name for the 'already scored by X' badge.
export const scoringBoard = async (_req, res) => {
  const teams = await prisma.team.findMany({
    where: { status: 'FINALIZED' },
    select: {
      id: true, name: true,
      domain: { select: { id: true, name: true } },
      problemStatement: { select: { id: true, title: true } },
      evaluations: {
        select: {
          id: true, round: true, total: true,
          jury: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ count: teams.length, teams });
};
