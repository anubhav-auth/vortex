import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import {
  bulkUploadSchema,
  registryIdParamSchema,
  listRegistryQuerySchema,
} from '../validators/registry.schema.js';
import { list, bulkUpload, remove } from '../controllers/registry.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', validate({ query: listRegistryQuerySchema }), ah(list));
router.post('/bulk', validate({ body: bulkUploadSchema }), ah(bulkUpload));
router.delete('/:id', validate({ params: registryIdParamSchema }), ah(remove));

export default router;
