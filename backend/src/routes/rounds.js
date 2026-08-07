import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import * as rounds from '../controllers/roundControl.controller.js';

// Read-only round state for any authenticated user — students need to
// know if scoring is in progress, juries need to see the open/locked
// badge accurately. Mutations stay admin-only at /api/admin/rounds.

const router = Router();
router.use(requireAuth);
router.get('/', ah(rounds.get));

export default router;
