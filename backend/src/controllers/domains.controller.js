import { prisma } from '../config/db.js';

export const getAllDomains = async (_req, res, next) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(domains);
  } catch (err) {
    next(err);
  }
};

export const getDomainById = async (req, res, next) => {
  try {
    const domain = await prisma.domain.findUnique({
      where: { id: req.params.id },
    });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    res.json(domain);
  } catch (err) {
    next(err);
  }
};