import { Router } from 'express';
import { getAllDomains, getDomainById, createDomain, deleteDomain } from '../controllers/domains.controller.js';

const router = Router();

router.get('/', getAllDomains);
router.get('/:id', getDomainById);
router.post('/', createDomain);
router.delete('/:id', deleteDomain);

export default router;
