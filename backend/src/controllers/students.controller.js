import { prisma } from '../config/db.js';

export const registerStudent = async (req, res, next) => {
  try {
    const { fullName, rollNumber, email, gender, institution, domainId } = req.body;

    // Check domain exists
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const student = await prisma.student.create({
      data: { fullName, rollNumber, email, gender, institution, domainId },
      include: { domain: true },
    });

    res.status(201).json({ message: 'Registration successful', student });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email or roll number already exists' });
    }
    next(err);
  }
};

export const getStudentsByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { status } = req.query;

    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const where = { domainId };
    if (status) where.verificationStatus = status;

    const students = await prisma.student.findMany({
      where,
      include: { domain: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ domain: domain.name, count: students.length, students });
  } catch (err) {
    next(err);
  }
};

export const getVerifiedStudents = async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { verificationStatus: 'Verified' },
      include: { domain: true },
      orderBy: { fullName: 'asc' },
    });

    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
};

export const verifySingleStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Verified or Rejected' });
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Student not found' });

    const student = await prisma.student.update({
      where: { id },
      data: { verificationStatus: status },
      include: { domain: true },
    });

    res.json({ message: `Student ${status.toLowerCase()} successfully`, student });
  } catch (err) {
    next(err);
  }
};

export const batchVerifyByDomain = async (req, res, next) => {
  try {
    const { domainId } = req.params;
    const { status } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Verified or Rejected' });
    }

    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const result = await prisma.student.updateMany({
      where: { domainId, verificationStatus: 'Pending' },
      data: { verificationStatus: status },
    });

    res.json({
      message: `${result.count} student(s) ${status.toLowerCase()} in ${domain.name} domain`,
      count: result.count,
    });
  } catch (err) {
    next(err);
  }
};