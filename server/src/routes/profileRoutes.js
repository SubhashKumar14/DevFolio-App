import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;
