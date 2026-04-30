import { prisma } from '../config/db.js';

export const getAllProblemStatements = async (req, res, next) => {
  try {
    const { domainId } = req.query;
    const where = domainId ? { domainId } : {};

    const problemStatements = await prisma.problemStatement.findMany({
      where,
      include: { domain: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ count: problemStatements.length, problemStatements });
  } catch (err) {
    next(err);
  }
};

export const getProblemStatementById = async (req, res, next) => {
  try {
    const ps = await prisma.problemStatement.findUnique({
      where: { id: req.params.id },
      include: { domain: true },
    });

    if (!ps) return res.status(404).json({ error: 'Problem statement not found' });
    res.json(ps);
  } catch (err) {
    next(err);
  }
};

export const createProblemStatement = async (req, res, next) => {
  try {
    const { title, domainId, minDomainMembers } = req.body;

    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const ps = await prisma.problemStatement.create({
      data: { title, domainId, minDomainMembers: minDomainMembers || 2 },
      include: { domain: true },
    });

    res.status(201).json({ message: 'Problem statement created', ps });
  } catch (err) {
    next(err);
  }
};

export const deleteProblemStatement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.problemStatement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Problem statement not found' });

    await prisma.problemStatement.delete({ where: { id } });

    res.json({ message: 'Problem statement deleted' });
  } catch (err) {
    next(err);
  }
};