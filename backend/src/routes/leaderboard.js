import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { leaderboardQuerySchema } from '../validators/evaluation.schema.js';
import * as leaderboard from '../controllers/leaderboard.controller.js';

// Public read (subject to leaderboardVisible) + admin recompute.

const router = Router();

router.get('/',
  optionalAuth,
  validate({ query: leaderboardQuerySchema }),
  ah(leaderboard.list),
);

router.post('/recompute',
  requireAuth, requireRole('ADMIN'),
  ah(leaderboard.recompute),
);

export default router;
