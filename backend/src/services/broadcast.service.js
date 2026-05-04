import { prisma } from '../config/db.js';
import { BadRequest } from '../utils/errors.js';

// Broadcast is intentionally simple: write a row, list latest. Real-time
// fan-out happens in the Socket.IO layer that consumes the same row.

const BROADCAST_INCLUDE = {
  sender: { select: { id: true, fullName: true, role: true } },
};

export const broadcastService = {
  async create({ message, senderId }) {
    const trimmed = message?.trim();
    if (!trimmed) throw BadRequest('Message is required');

    return prisma.broadcast.create({
      data: { message: trimmed, senderId },
      include: BROADCAST_INCLUDE,
    });
  },

  list({ limit = 50 } = {}) {
    return prisma.broadcast.findMany({
      take: Math.min(limit, 200),
      orderBy: { createdAt: 'desc' },
      include: BROADCAST_INCLUDE,
    });
  },
};
