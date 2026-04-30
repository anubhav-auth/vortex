import { Router } from 'express';
import { 
  submitEvaluation, 
  getCriteria 
} from '../controllers/evaluations.controller.js';

const router = Router();

router.post('/', submitEvaluation);
router.get('/criteria', getCriteria);
router.post('/criteria', createCriteria);
router.delete('/criteria/:id', deleteCriteria);

export default router;
