import { Router } from 'express';
import { connectDsa, disconnectPlatform } from '../controllers/integrationController.js';
import { linkGithub } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/github/connect', authenticate, linkGithub);
router.post('/dsa/connect', authenticate, connectDsa);
router.patch('/platforms/:platform/disconnect', authenticate, disconnectPlatform);
// Compatibility alias for environments where PATCH is blocked or not routed correctly.
router.post('/platforms/:platform/disconnect', authenticate, disconnectPlatform);

export default router;
