import { Router } from 'express';
import { getAllDomains, getDomainById } from '../controllers/domains.controller.js';

const router = Router();

router.get('/', getAllDomains);
router.get('/:id', getDomainById);

export default router;
