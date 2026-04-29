import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  registerStudent,
  getStudentsByDomain,
  getVerifiedStudents,
  verifySingleStudent,    
  batchVerifyByDomain,  
} from '../controllers/students.controller.js';

const router = Router();

const registerSchema = z.object({
  fullName:    z.string().min(1),
  rollNumber:  z.string().min(1),
  email:       z.string().email(),
  gender:      z.enum(['Male', 'Female', 'Other']),
  institution: z.string().min(1),
  domainId:    z.string().min(1),
});

const verifySchema = z.object({
  status: z.enum(['Verified', 'Rejected']),
});

router.post('/register', validate(registerSchema), registerStudent);
router.get('/students/verified', getVerifiedStudents);
router.get('/domains/:domainId/students', getStudentsByDomain);
router.patch('/admin/students/:id/verify', validate(verifySchema), verifySingleStudent);   
router.post('/admin/domains/:domainId/verify', validate(verifySchema), batchVerifyByDomain); 

export default router;
