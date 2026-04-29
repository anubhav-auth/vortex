import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
    createTeam,
    addMember,
    removeMember,
    getTeam,
    validateTeam,   
    confirmTeam,    
  } from '../controllers/teams.controller.js';

const router = Router();

const createTeamSchema = z.object({
  teamName: z.string().min(1),
  psId:     z.string().min(1),
  leaderId: z.string().min(1),
});

const addMemberSchema = z.object({       
    studentId: z.string().min(1),
  });

router.post('/', validate(createTeamSchema), createTeam);
router.get('/:id', getTeam);                                               
router.post('/:id/members', validate(addMemberSchema), addMember);         
router.delete('/:id/members/:studentId', removeMember);  
router.get('/:id/validate', validateTeam);     
router.post('/:id/confirm', confirmTeam);      

export default router;