import { Router } from 'express';
import { exportUserData } from '../controllers/exportController.js';
import { searchUsers } from '../controllers/userSearchController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/search', searchUsers); // public
router.get('/export', authenticate, exportUserData);

export default router;
