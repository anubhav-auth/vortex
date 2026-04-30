import { prisma } from '../config/db.js';

export const submitEvaluation = async (req, res, next) => {
  try {
    const { teamId, round, juryId, feedback, scores } = req.body;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: 'SQUAD_NOT_FOUND' });

    // Check if already evaluated (marks are immutable once saved)
    const existing = await prisma.evaluation.findUnique({
      where: { teamId_round: { teamId, round } }
    });
    if (existing) return res.status(403).json({ error: 'EVALUATION_LOCKED: MARKS_IMMUTABLE' });

    const totalScore = scores.reduce((sum, s) => sum + s.marks, 0);

    const evaluation = await prisma.evaluation.create({
      data: {
        teamId,
        round,
        juryId,
        feedback,
        totalScore,
        scores: {
          create: scores.map(s => ({
            criteriaId: s.criteriaId,
            marks: s.marks
          }))
        }
      }
    });

    // Update leaderboard
    const field = round === 1 ? 'r1Score' : round === 2 ? 'r2Score' : 'gfScore';
    await prisma.leaderboard.upsert({
      where: { teamId },
      update: { [field]: totalScore },
      create: { teamId, [field]: totalScore }
    });

    res.status(201).json({ message: 'EVALUATION_FINALIZED', evaluation });
  } catch (err) {
    next(err);
  }
};

export const getCriteria = async (req, res, next) => {
  try {
    const criteria = await prisma.evaluationCriteria.findMany();
    res.json(criteria);
  } catch (err) {
    next(err);
  }
};

export const createCriteria = async (req, res, next) => {
  try {
    const { name, maxMarks } = req.body;
    const criteria = await prisma.evaluationCriteria.create({
      data: { name, maxMarks }
    });
    res.status(201).json(criteria);
  } catch (err) {
    next(err);
  }
};

export const deleteCriteria = async (req, res, next) => {
  try {
    await prisma.evaluationCriteria.delete({ where: { id: req.params.id } });
    res.json({ message: 'CRITERIA_REMOVED' });
  } catch (err) {
    next(err);
  }
};
