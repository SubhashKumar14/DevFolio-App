import { Router } from 'express';
import { getGithubStats, getDsaStats, syncStats } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/github/:userId', optionalAuth, getGithubStats);
router.get('/dsa/:userId', optionalAuth, getDsaStats);
router.post('/sync', authenticate, syncLimiter, syncStats);

export default router;
