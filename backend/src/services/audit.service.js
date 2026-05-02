import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Fire-and-forget audit writes. Failures are logged but never thrown to the
// caller — an audit failure should not break a successful business action.

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
};
