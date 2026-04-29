import { Router } from 'express';
import { getAwards } from '../controllers/awards.controller.js';

const router = Router();

router.get('/', getAwards);

export default router;
