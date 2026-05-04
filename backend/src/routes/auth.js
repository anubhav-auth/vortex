import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { loginSchema } from '../validators/auth.schema.js';
import { login, me } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), ah(login));
router.get('/me', requireAuth, ah(me));

export default router;
