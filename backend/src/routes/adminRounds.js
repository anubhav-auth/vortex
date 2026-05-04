import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { setRoundStateSchema } from '../validators/evaluation.schema.js';
import * as rounds from '../controllers/roundControl.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', ah(rounds.get));
router.patch('/', validate({ body: setRoundStateSchema }), ah(rounds.setRoundState));

export default router;
