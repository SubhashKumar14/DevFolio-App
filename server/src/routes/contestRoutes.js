import { Router } from 'express';
import { getUpcomingContests } from '../controllers/contestController.js';

const router = Router();

// Public — no auth needed
router.get('/upcoming', getUpcomingContests);

export default router;
