import { Router } from 'express';
import { getGithubStats, getDsaStats, syncStats } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/github/:userId', authenticate, getGithubStats);
router.get('/dsa/:userId', authenticate, getDsaStats);
router.post('/sync', authenticate, syncLimiter, syncStats);

export default router;
