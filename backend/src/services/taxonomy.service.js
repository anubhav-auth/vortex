import { prisma } from '../config/db.js';
import { Conflict, NotFound, BadRequest } from '../utils/errors.js';

// Three taxonomies share the same shape: stable string name, optional
// soft-delete refusal when in use. One service file, three sub-namespaces
// so callers stay readable.

const wrapUnique = (err, label) => {
  if (err.code === 'P2002') return Conflict(`${label} name already exists`, { field: 'name' });
  if (err.code === 'P2003') return Conflict(`${label} is referenced by other records`);
  return err;
};

// ── Institutions ────────────────────────────────────────────────────────────
export const institutionService = {
  list: () => prisma.institution.findMany({ orderBy: { name: 'asc' } }),

  async create({ name }) {
    try {
      return await prisma.institution.create({ data: { name } });
    } catch (err) { throw wrapUnique(err, 'Institution'); }
  },

  async update({ id, name }) {
    try {
      return await prisma.institution.update({ where: { id }, data: { name } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Institution not found');
      throw wrapUnique(err, 'Institution');
    }
  },

  async remove({ id }) {
    const userCount = await prisma.user.count({ where: { institutionId: id } });
    const regCount  = await prisma.collegeRegistry.count({ where: { institutionId: id } });
    if (userCount + regCount > 0) {
      throw Conflict('Institution is in use', { users: userCount, registry: regCount });
    }
    try {
      await prisma.institution.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Institution not found');
      throw err;
    }
  },
};

// ── Domains ────────────────────────────────────────────────────────────────
export const domainService = {
  list: () => prisma.domain.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { problemStatements: true, teams: true } } },
  }),

  async create({ name }) {
    try {
      return await prisma.domain.create({ data: { name } });
    } catch (err) { throw wrapUnique(err, 'Domain'); }
  },

  async update({ id, name }) {
    try {
      return await prisma.domain.update({ where: { id }, data: { name } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Domain not found');
      throw wrapUnique(err, 'Domain');
    }
  },

  async remove({ id }) {
    const counts = await prisma.$transaction([
      prisma.user.count({ where: { domainId: id } }),
      prisma.problemStatement.count({ where: { domainId: id } }),
      prisma.team.count({ where: { domainId: id } }),
    ]);
    const [users, ps, teams] = counts;
    if (users + ps + teams > 0) {
      throw Conflict('Domain is in use', { users, problemStatements: ps, teams });
    }
    try {
      await prisma.domain.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Domain not found');
      throw err;
    }
  },
};

// ── Problem Statements ─────────────────────────────────────────────────────
export const problemStatementService = {
  list({ domainId } = {}) {
    return prisma.problemStatement.findMany({
      where: { ...(domainId && { domainId }) },
      include: { domain: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async get({ id }) {
    const ps = await prisma.problemStatement.findUnique({
      where: { id },
      include: { domain: { select: { id: true, name: true } } },
    });
    if (!ps) throw NotFound('Problem statement not found');
    return ps;
  },

  async create({ title, description, domainId }) {
    const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { id: true } });
    if (!domain) throw BadRequest('Invalid domain');
    return prisma.problemStatement.create({
      data: { title, description, domainId },
      include: { domain: { select: { id: true, name: true } } },
    });
  },

  async update({ id, title, description, domainId }) {
    if (domainId) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { id: true } });
      if (!domain) throw BadRequest('Invalid domain');
    }
    try {
      return await prisma.problemStatement.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(domainId !== undefined && { domainId }),
        },
        include: { domain: { select: { id: true, name: true } } },
      });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Problem statement not found');
      throw err;
    }
  },

  async remove({ id }) {
    const teamCount = await prisma.team.count({ where: { psId: id } });
    if (teamCount > 0) {
      throw Conflict('Problem statement is referenced by teams', { teams: teamCount });
    }
    try {
      await prisma.problemStatement.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Problem statement not found');
      throw err;
    }
  },
};
