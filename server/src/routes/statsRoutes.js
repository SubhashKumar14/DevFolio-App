import { Router } from 'express';
import { getGithubStats, getDsaStats, getPlatformStats, syncStats, getSyncJobStatus } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/github/:userId', optionalAuth, getGithubStats);
router.get('/dsa/:userId', optionalAuth, getDsaStats);
router.get('/platforms/:userId', optionalAuth, getPlatformStats);
router.post('/sync', authenticate, syncLimiter, syncStats);
router.get('/sync/:jobId', authenticate, getSyncJobStatus);

export default router;
