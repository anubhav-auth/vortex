import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireRoundUnlocked } from '../middleware/round.js';
import { ah } from '../utils/asyncHandler.js';
import {
  myAssignmentsQuerySchema,
  submitEvaluationSchema,
} from '../validators/evaluation.schema.js';
import * as juryAssignment from '../controllers/juryAssignment.controller.js';
import * as evaluation     from '../controllers/evaluation.controller.js';

// Jury-only routes. The route layer pre-blocks scoring on a locked round
// via requireRoundUnlocked; the service layer re-checks inside its txn.

const router = Router();

router.use(requireAuth, requireRole('JURY'));

// Open-scoring board: every FINALIZED team with their per-round score state.
// Replaces the old assignment-list as the jury's primary view.
router.get('/teams', ah(evaluation.scoringBoard));

// Legacy: still served so any caller that references it works, but the
// admin-side assignment UI has been removed.
router.get('/assignments',
  validate({ query: myAssignmentsQuerySchema }),
  ah(juryAssignment.myAssignments),
);

router.get('/evaluations',
  validate({ query: myAssignmentsQuerySchema }),
  ah(evaluation.myEvaluations),
);

router.post('/evaluations',
  validate({ body: submitEvaluationSchema }),
  requireRoundUnlocked((req) => req.body.round),
  ah(evaluation.submit),
);

export default router;
