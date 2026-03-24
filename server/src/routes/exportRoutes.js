import { Router } from 'express';
import { exportUserData } from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/export', authenticate, exportUserData);

export default router;
