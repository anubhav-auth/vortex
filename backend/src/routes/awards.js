import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import * as awards from '../controllers/awards.controller.js';

const router = Router();

router.get('/', optionalAuth, ah(awards.list));

export default router;
