import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { inviteIdParamSchema } from '../validators/team.schema.js';
import * as invite from '../controllers/invite.controller.js';

// Endpoints addressing a single invite by id, plus the "my pending invites"
// view. Team-scoped invite endpoints live in routes/teams.js.

const router = Router();

router.use(requireAuth, requireRole('STUDENT'));

router.get('/me', ah(invite.listMine));

router.post('/:inviteId/accept',
  validate({ params: inviteIdParamSchema }), ah(invite.accept));

router.post('/:inviteId/decline',
  validate({ params: inviteIdParamSchema }), ah(invite.decline));

router.post('/:inviteId/cancel',
  validate({ params: inviteIdParamSchema }), ah(invite.cancel));

export default router;
