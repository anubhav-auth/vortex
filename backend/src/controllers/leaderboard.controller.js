import { leaderboardService } from '../services/leaderboard.service.js';
import { Forbidden } from '../utils/errors.js';

export const list = async (req, res) => {
  const { hidden, showMarks, entries } = await leaderboardService.list({
    limit: req.query.limit,
  });
  if (hidden) throw Forbidden('Leaderboard is currently hidden');
  res.json({ showMarks, count: entries.length, entries });
};

export const recompute = async (_req, res) => {
  const summary = await leaderboardService.recomputeAll();
  res.json({ summary });
};
