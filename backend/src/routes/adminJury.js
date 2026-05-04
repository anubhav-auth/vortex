import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import {
  createAssignmentSchema,
  reassignAssignmentSchema,
  assignmentIdParamSchema,
  listAssignmentsQuerySchema,
} from '../validators/evaluation.schema.js';
import * as jury from '../controllers/juryAssignment.controller.js';

// Admin-side jury assignment management.

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/',
  validate({ query: listAssignmentsQuerySchema }),
  ah(jury.list),
);

router.post('/',
  validate({ body: createAssignmentSchema }),
  ah(jury.create),
);

router.put('/',
  validate({ body: reassignAssignmentSchema }),
  ah(jury.reassign),
);

router.delete('/:id',
  validate({ params: assignmentIdParamSchema }),
  ah(jury.remove),
);

export default router;
