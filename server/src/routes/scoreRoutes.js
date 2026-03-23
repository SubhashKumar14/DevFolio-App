import { Router } from 'express';
import { getScore, getScoreHistory, recomputeScore } from '../controllers/scoreController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', authenticate, getScore);
router.get('/:userId/history', authenticate, getScoreHistory);
router.post('/recompute', authenticate, recomputeScore);

export default router;
