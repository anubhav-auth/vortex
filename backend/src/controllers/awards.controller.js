import { awardsService } from '../services/awards.service.js';
import { Forbidden } from '../utils/errors.js';

export const list = async (_req, res) => {
  const awards = await awardsService.list();
  if (awards.hidden) throw Forbidden('Leaderboard is currently hidden');
  res.json({ awards });
};
