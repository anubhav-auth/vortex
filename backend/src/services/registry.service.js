import { prisma } from '../config/db.js';
import { NotFound } from '../utils/errors.js';

// Source-of-truth registry the admin uploads. A pending student is "matched"
// if a row with the same registrationNo exists (case-sensitive — registry IDs
// are typically canonical). Email is shown to the admin as a tie-breaker but
// not required to match.

export const registryService = {
  async bulkUpsert(rows, uploadedById) {
    // One transaction, one round-trip per row. Fine for typical registry
    // sizes (hundreds to low thousands); revisit with COPY for >10k.
    const result = await prisma.$transaction(
      rows.map((row) =>
        prisma.collegeRegistry.upsert({
          where: { registrationNo: row.registrationNo },
          create: { ...row, uploadedById },
          update: { ...row, uploadedById },
        }),
      ),
    );
    return { count: result.length };
  },

  list({ institutionId, search } = {}) {
    return prisma.collegeRegistry.findMany({
      where: {
        ...(institutionId && { institutionId }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { registrationNo: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { institution: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: 'desc' },
      take: 500,
    });
  },

  async remove(id) {
    try {
      await prisma.collegeRegistry.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') throw NotFound('Registry entry not found');
      throw err;
    }
  },

  // Look up a registry row by the candidate user's registrationNo. Returns
  // { matched: boolean, entry?: ... }. Email is compared opportunistically.
  async matchUser({ registrationNo, email }) {
    if (!registrationNo) return { matched: false };
    const entry = await prisma.collegeRegistry.findUnique({
      where: { registrationNo },
      include: { institution: { select: { id: true, name: true } } },
    });
    if (!entry) return { matched: false };
    return {
      matched: true,
      entry,
      emailMatches: email ? entry.email.toLowerCase() === email.toLowerCase() : null,
    };
  },
};
