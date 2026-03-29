import { Router } from 'express';
import { getScore, getScoreHistory, getScoreBenchmark, computeScore } from '../controllers/scoreController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, getScore);
router.get('/:userId/history', optionalAuth, getScoreHistory);
router.get('/:userId/benchmark', optionalAuth, getScoreBenchmark);
router.post('/recompute', authenticate, computeScore);

export default router;
