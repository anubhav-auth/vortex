import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { updateRulesSchema } from '../validators/rules.schema.js';
import * as rules from '../controllers/rules.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/',     ah(rules.get));
router.put('/',     validate({ body: updateRulesSchema }), ah(rules.update));
router.post('/recompute-all', ah(rules.recomputeAll));

export default router;
