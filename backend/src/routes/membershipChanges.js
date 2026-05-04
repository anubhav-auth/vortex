import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { changeIdParamSchema } from '../validators/team.schema.js';
import * as change from '../controllers/membershipChange.controller.js';

// Single-request actions + queue views for the dual-approval workflow.
// Initiation (LEAVE/DISMISS) lives on team-scoped endpoints in routes/teams.js.

const router = Router();

router.use(requireAuth, requireRole('STUDENT'));

router.get('/awaiting-me',  ah(change.listAwaitingMyApproval));
router.get('/initiated-me', ah(change.listInitiatedByMe));

router.post('/:changeId/approve',
  validate({ params: changeIdParamSchema }), ah(change.approve));

router.post('/:changeId/deny',
  validate({ params: changeIdParamSchema }), ah(change.deny));

router.post('/:changeId/cancel',
  validate({ params: changeIdParamSchema }), ah(change.cancel));

export default router;
