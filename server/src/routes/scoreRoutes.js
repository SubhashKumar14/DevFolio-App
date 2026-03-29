import { Router } from 'express';
import { getScore, getScoreHistory, computeScore } from '../controllers/scoreController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, getScore);
router.get('/:userId/history', optionalAuth, getScoreHistory);
router.post('/recompute', authenticate, computeScore);

export default router;
