import { Router } from 'express';
import { 
  updateGlobalConfig, 
  getGlobalConfig, 
  broadcastMail, 
  generateReport 
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/config', getGlobalConfig);
router.patch('/config', updateGlobalConfig);
router.post('/broadcast', broadcastMail);
router.get('/report', generateReport);

export default router;
