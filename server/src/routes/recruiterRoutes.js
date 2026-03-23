import { Router } from 'express';
import { searchDevelopers } from '../controllers/recruiterController.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

router.get('/search', authenticate, roleGuard('recruiter', 'admin'), searchDevelopers);

export default router;
