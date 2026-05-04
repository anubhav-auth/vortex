import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Audit writes have two forms:
//
//   record(...)         — fire-and-forget; failures logged not thrown.
//                         Use from controllers AFTER the business action
//                         has committed; an audit failure must not break
//                         a successful response.
//
//   log(tx, ...)        — transactional; throws on failure. Use from
//                         services when the audit row should land in
//                         the same transaction as the business write
//                         (e.g. role-changing operations where audit is
//                         a hard requirement).
//
// Reads:
//
//   list({...})         — admin browse with filters; capped at 200.

export const auditService = {
  async record({ actorId, action, entityType, entityId, details }) {
    try {
      await prisma.auditLog.create({
        data: { actorId, action, entityType, entityId, details },
      });
    } catch (err) {
      logger.warn('audit.write_failed', { action, entityId, err: err.message });
    }
  },

  log(tx, { actorId, action, entityType, entityId, details }) {
    return tx.auditLog.create({
      data: { actorId, action, entityType, entityId, details },
    });
  },

  list({ action, entityType, actorId, since, limit = 100 } = {}) {
    return prisma.auditLog.findMany({
      where: {
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(actorId && { actorId }),
        ...(since && { createdAt: { gte: since } }),
      },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  },
};
