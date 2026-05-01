import { prisma } from '../config/db.js';

export const getAllDomains = async (req, res, next) => {
  try {
    const domains = await prisma.domain.findMany({ 
      orderBy: { name: 'asc' },
      include: { problemStatements: true }
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
      include: { problemStatements: true }
    });
    if (!domain) return res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
    res.json(domain);
  } catch (err) {
    next(err);
  }
};

export const createDomain = async (req, res, next) => {
  try {
    const { name } = req.body;
    const domain = await prisma.domain.create({
      data: { name }
    });
    res.status(201).json(domain);
  } catch (err) {
    next(err);
  }
};

export const deleteDomain = async (req, res, next) => {
  try {
    await prisma.domain.delete({ where: { id: req.params.id } });
    res.json({ message: 'DOMAIN_REMOVED' });
  } catch (err) {
    next(err);
  }
};
