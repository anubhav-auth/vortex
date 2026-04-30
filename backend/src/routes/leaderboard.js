import { Router } from 'express';
import {
  calculateLeaderboard,
  getLeaderboard,
} from '../controllers/leaderboard.controller.js';

const router = Router();

router.post('/calculate', calculateLeaderboard);
router.get('/', getLeaderboard);

export default router;