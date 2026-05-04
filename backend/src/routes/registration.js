import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { ah } from '../utils/asyncHandler.js';
import { registrationSchema } from '../validators/registration.schema.js';
import { register } from '../controllers/registration.controller.js';

const router = Router();

router.post('/', validate({ body: registrationSchema }), ah(register));

export default router;
