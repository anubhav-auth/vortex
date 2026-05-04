import { prisma } from '../config/db.js';
import { Forbidden, BadRequest } from '../utils/errors.js';

const ROUND_FIELD = {
  ROUND_1: 'round1State',
  ROUND_2: 'round2State',
  ROUND_3: 'round3State',
};

// Resolve which round the request is targeting. By default we look at
// `req.body.round`, but callers can pass an extractor for query/param cases.
//
// Usage:
//   router.post('/evaluations', requireAuth, requireRole('JURY'),
//               requireRoundUnlocked(), handler)
//
//   router.get('/evaluations/round/:round', requireAuth,
//              requireRoundUnlocked((req) => req.params.round), handler)
export const requireRoundUnlocked = (extract = (req) => req.body?.round) => async (req, _res, next) => {
  try {
    const round = extract(req);
    const field = ROUND_FIELD[round];
    if (!field) return next(BadRequest('Invalid or missing round', { round }));

    const control = await prisma.roundControl.findUnique({
      where: { id: 'round_control' },
      select: { [field]: true },
    });

    if (!control) return next(Forbidden('Round control not initialized'));
    if (control[field] !== 'UNLOCKED') {
      return next(Forbidden('Round is not currently open', { round, state: control[field] }));
    }
    next();
  } catch (err) {
    next(err);
  }
};
