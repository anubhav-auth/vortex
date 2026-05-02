import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

import {
  createTeamSchema,
  teamIdParamSchema,
  listTeamsQuerySchema,
  listJoinableQuerySchema,
  createInviteSchema,
  listTeamInvitesQuerySchema,
  listTeamRequestsQuerySchema,
  leaveSchema,
  dismissSchema,
} from '../validators/team.schema.js';

import * as team    from '../controllers/team.controller.js';
import * as invite  from '../controllers/invite.controller.js';
import * as join    from '../controllers/joinRequest.controller.js';
import * as change  from '../controllers/membershipChange.controller.js';

const router = Router();

router.use(requireAuth);

// ── team
router.get('/',          validate({ query: listTeamsQuerySchema }), ah(team.list));
router.get('/joinable',  validate({ query: listJoinableQuerySchema }), ah(team.listJoinable));

router.post('/',
  requireRole('STUDENT'),
  validate({ body: createTeamSchema }),
  ah(team.create),
);

router.get('/:id',
  validate({ params: teamIdParamSchema }),
  ah(team.get),
);

router.post('/:id/finalize',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema }),
  ah(team.finalize),
);

// ── invites scoped to a team
router.post('/:id/invites',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: createInviteSchema }),
  ah(invite.create),
);
router.get('/:id/invites',
  validate({ params: teamIdParamSchema, query: listTeamInvitesQuerySchema }),
  ah(invite.listForTeam),
);

// ── join requests scoped to a team
router.post('/:id/join-requests',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema }),
  ah(join.create),
);
router.get('/:id/join-requests',
  validate({ params: teamIdParamSchema, query: listTeamRequestsQuerySchema }),
  ah(join.listForTeam),
);

// ── membership changes scoped to a team
router.post('/:id/leave',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: leaveSchema }),
  ah(change.requestLeave),
);
router.post('/:id/dismiss',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: dismissSchema }),
  ah(change.requestDismiss),
);

export default router;
