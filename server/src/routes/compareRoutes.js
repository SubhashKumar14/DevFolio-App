import { Router } from 'express';
import { compareDevelopers } from '../controllers/compareController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:userId1/:userId2', authenticate, compareDevelopers);

export default router;
