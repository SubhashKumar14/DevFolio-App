import { Router } from 'express';
import { getPortfolio, savePortfolio, toggleVisibility } from '../controllers/portfolioController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, getPortfolio);
router.post('/', authenticate, savePortfolio);
router.patch('/visibility', authenticate, toggleVisibility);

export default router;
