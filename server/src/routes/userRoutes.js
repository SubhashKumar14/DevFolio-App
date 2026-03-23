import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

export default router;
