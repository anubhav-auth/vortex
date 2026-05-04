import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO singleton.
//
// Lifecycle:
//   - init(httpServer) is called once from index.js after app.listen so the
//     same HTTP server multiplexes Express + websockets.
//   - getIO() returns the live instance. Callers in services/controllers go
//     through realtime/emitter.js so they never touch the io object directly.
//
// Auth:
//   - Client passes JWT in handshake auth: io({ auth: { token } })
//   - We verify with ACCESS_TOKEN_SECRET, attach socket.data.user, then auto-
//     join `global` and `user:<id>`. Connections without a valid token are
//     rejected at handshake time — no anonymous sockets.
//
// Rooms:
//   global       — every authenticated socket
//   user:<id>    — that user's private inbox (invites, request decisions, ...)
//   team:<id>    — members of a single team (membership-change events)
//
// Team room joining is the client's responsibility (the client knows which
// team it's in via /api/teams/me); server provides a join handler that
// verifies membership before honoring the request.
// ─────────────────────────────────────────────────────────────────────────────

let io = null;

const verifyHandshake = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_REQUIRED'));
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    socket.data.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(new Error(err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'));
  }
};

const wireSocket = (socket) => {
  const { user } = socket.data;
  socket.join('global');
  socket.join(`user:${user.id}`);

  logger.debug('socket.connect', { socketId: socket.id, userId: user.id, role: user.role });

  // Client opts into a team room. We don't proactively look up the user's
  // team membership here — the client tells us, server verifies via callback
  // pattern so the client can react to a rejection.
  socket.on('team:join', async ({ teamId } = {}, ack) => {
    if (!teamId || typeof teamId !== 'string') {
      return ack?.({ ok: false, error: 'INVALID_TEAM_ID' });
    }
    // Lazy import to avoid circular: realtime → prisma → realtime.
    const { prisma } = await import('../config/db.js');
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
      select: { role: true },
    });
    if (!member) return ack?.({ ok: false, error: 'NOT_A_MEMBER' });
    socket.join(`team:${teamId}`);
    ack?.({ ok: true });
  });

  socket.on('team:leave', ({ teamId } = {}, ack) => {
    if (teamId) socket.leave(`team:${teamId}`);
    ack?.({ ok: true });
  });

  socket.on('disconnect', (reason) => {
    logger.debug('socket.disconnect', { socketId: socket.id, userId: user.id, reason });
  });
};

export const initIO = (httpServer) => {
  if (io) return io;
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    serveClient: false,
  });

  io.use(verifyHandshake);
  io.on('connection', wireSocket);

  logger.info('socket.io ready');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// Used by tests / shutdown.
export const closeIO = async () => {
  if (!io) return;
  await io.close();
  io = null;
};
