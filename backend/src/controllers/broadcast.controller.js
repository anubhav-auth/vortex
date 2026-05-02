import { broadcastService } from '../services/broadcast.service.js';
import { auditService } from '../services/audit.service.js';
import { emitBroadcastNew } from '../realtime/emitter.js';

export const create = async (req, res) => {
  const broadcast = await broadcastService.create({
    message:  req.body.message,
    senderId: req.user.id,
  });

  auditService.record({
    actorId: req.user.id,
    action: 'BROADCAST_SENT',
    entityType: 'Broadcast',
    entityId: broadcast.id,
    details: { length: broadcast.message.length },
  });

  // Real-time fan-out to every connected, authenticated socket.
  emitBroadcastNew(broadcast);

  res.status(201).json({ broadcast });
};

export const list = async (req, res) => {
  const broadcasts = await broadcastService.list({ limit: req.query.limit });
  res.json({ count: broadcasts.length, broadcasts });
};
