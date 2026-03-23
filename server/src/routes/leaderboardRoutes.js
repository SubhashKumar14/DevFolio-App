import { Router } from 'express';
import { getLeaderboard, getCollegeLeaderboard } from '../controllers/leaderboardController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getLeaderboard);
router.get('/college/:collegeName', optionalAuth, getCollegeLeaderboard);

export default router;
