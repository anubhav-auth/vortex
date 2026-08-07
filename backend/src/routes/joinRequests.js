import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { requestIdParamSchema } from '../validators/team.schema.js';
import * as join from '../controllers/joinRequest.controller.js';

// Endpoints addressing a single join request by id, plus the "my outgoing
// requests" view. Team-scoped endpoints live in routes/teams.js.

const router = Router();

router.use(requireAuth, requireRole('STUDENT'));

router.get('/me', ah(join.listMine));

router.post('/:requestId/approve',
  validate({ params: requestIdParamSchema }), ah(join.approve));

router.post('/:requestId/deny',
  validate({ params: requestIdParamSchema }), ah(join.deny));

router.post('/:requestId/cancel',
  validate({ params: requestIdParamSchema }), ah(join.cancel));

export default router;
