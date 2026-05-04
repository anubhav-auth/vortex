import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import {
  createBroadcastSchema,
  listBroadcastQuerySchema,
} from '../validators/broadcast.schema.js';
import * as broadcast from '../controllers/broadcast.controller.js';

// Two routers compose into one mount-level decision in index.js:
//   GET  /api/broadcast        any authenticated user
//   POST /api/admin/broadcast  admin only

export const publicRouter = Router();
publicRouter.get('/',
  requireAuth,
  validate({ query: listBroadcastQuerySchema }),
  ah(broadcast.list),
);

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));
adminRouter.post('/',
  validate({ body: createBroadcastSchema }),
  ah(broadcast.create),
);
