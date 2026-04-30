import { Router } from 'express';
import {
  createSquad,
  getCompatibleTeams,
  sendJoinRequest,
  handleJoinRequest,
  getTeamRequests,
  getTeamDetails,
  getAllTeams
} from '../controllers/teams.controller.js';

const router = Router();

router.get('/', getAllTeams);
router.get('/compatible', getCompatibleTeams);
router.get('/:identifier', getTeamDetails); // identifier can be ID or Team Name
router.post('/', createSquad);
router.post('/request', sendJoinRequest);
router.patch('/request', handleJoinRequest);
router.get('/:teamId/requests', getTeamRequests);

export default router;
