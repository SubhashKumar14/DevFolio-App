import { Router } from 'express';
import { getScore, getScoreHistory, recomputeScore } from '../controllers/scoreController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, getScore);
router.get('/:userId/history', optionalAuth, getScoreHistory);
router.post('/recompute', authenticate, recomputeScore);

export default router;
