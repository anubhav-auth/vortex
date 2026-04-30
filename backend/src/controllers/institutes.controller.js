import { prisma } from '../config/db.js';

export const getInstitutes = async (req, res, next) => {
  try {
    const institutes = await prisma.institute.findMany({ orderBy: { name: 'asc' } });
    res.json(institutes);
  } catch (err) {
    next(err);
  }
};

export const createInstitute = async (req, res, next) => {
  try {
    const { name } = req.body;
    const institute = await prisma.institute.create({ data: { name } });
    res.json(institute);
  } catch (err) {
    next(err);
  }
};

export const deleteInstitute = async (req, res, next) => {
  try {
    await prisma.institute.delete({ where: { id: req.params.id } });
    res.json({ message: 'INSTITUTE_REMOVED' });
  } catch (err) {
    next(err);
  }
};
