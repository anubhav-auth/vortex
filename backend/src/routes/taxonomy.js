import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import {
  idParamSchema,
  namedCreateSchema,
  namedUpdateSchema,
  psListQuerySchema,
  psCreateSchema,
  psUpdateSchema,
} from '../validators/taxonomy.schema.js';
import * as t from '../controllers/taxonomy.controller.js';

// Public reads (registration form needs them pre-login). Mutations admin-only.
// Two routers exported so index.js can mount /api/taxonomy/* (public+admin
// reads) and /api/admin/taxonomy/* (admin writes).

export const publicRouter = Router();

publicRouter.get('/institutions', optionalAuth, ah(t.institutions.list));
publicRouter.get('/domains',      optionalAuth, ah(t.domains.list));
publicRouter.get('/problem-statements',
  optionalAuth,
  validate({ query: psListQuerySchema }),
  ah(t.problemStatements.list),
);
publicRouter.get('/problem-statements/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  ah(t.problemStatements.get),
);

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

// institutions
adminRouter.post('/institutions',
  validate({ body: namedCreateSchema }), ah(t.institutions.create));
adminRouter.put('/institutions/:id',
  validate({ params: idParamSchema, body: namedUpdateSchema }), ah(t.institutions.update));
adminRouter.delete('/institutions/:id',
  validate({ params: idParamSchema }), ah(t.institutions.remove));

// domains
adminRouter.post('/domains',
  validate({ body: namedCreateSchema }), ah(t.domains.create));
adminRouter.put('/domains/:id',
  validate({ params: idParamSchema, body: namedUpdateSchema }), ah(t.domains.update));
adminRouter.delete('/domains/:id',
  validate({ params: idParamSchema }), ah(t.domains.remove));

// problem statements
adminRouter.post('/problem-statements',
  validate({ body: psCreateSchema }), ah(t.problemStatements.create));
adminRouter.put('/problem-statements/:id',
  validate({ params: idParamSchema, body: psUpdateSchema }), ah(t.problemStatements.update));
adminRouter.delete('/problem-statements/:id',
  validate({ params: idParamSchema }), ah(t.problemStatements.remove));
