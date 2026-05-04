import { auditService } from '../services/audit.service.js';

export const list = async (req, res) => {
  const entries = await auditService.list(req.query);
  res.json({ count: entries.length, entries });
};
