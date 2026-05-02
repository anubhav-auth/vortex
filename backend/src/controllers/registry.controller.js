import { registryService } from '../services/registry.service.js';
import { auditService } from '../services/audit.service.js';

export const list = async (req, res) => {
  const entries = await registryService.list(req.query);
  res.json({ count: entries.length, entries });
};

export const bulkUpload = async (req, res) => {
  const result = await registryService.bulkUpsert(req.body.rows, req.user.id);

  auditService.record({
    actorId: req.user.id,
    action: 'REGISTRY_SYNCED',
    entityType: 'CollegeRegistry',
    details: { count: result.count },
  });

  res.status(201).json({ message: 'Registry synced', ...result });
};

export const remove = async (req, res) => {
  await registryService.remove(req.params.id);
  res.status(204).end();
};
