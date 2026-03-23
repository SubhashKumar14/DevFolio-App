import { Router } from 'express';
import { connectDsa, connectGithub } from '../controllers/integrationController.js';
import { linkGithub } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/github/connect', authenticate, linkGithub);
router.post('/dsa/connect', authenticate, connectDsa);

export default router;
