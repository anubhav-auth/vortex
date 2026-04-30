import { Router } from 'express';
import { getInstitutes, createInstitute, deleteInstitute } from '../controllers/institutes.controller.js';

const router = Router();

router.get('/', getInstitutes);
router.post('/', createInstitute);
router.delete('/:id', deleteInstitute);

export default router;
