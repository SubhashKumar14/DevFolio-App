import { Router } from 'express';
import { listUsers, deleteUser, changeRole, getStats, triggerGlobalSync, getGlobalSyncJobStatus } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

router.get('/stats', authenticate, roleGuard('admin'), getStats);
router.get('/users', authenticate, roleGuard('admin'), listUsers);
router.patch('/users/:userId/role', authenticate, roleGuard('admin'), changeRole);
router.delete('/users/:userId', authenticate, roleGuard('admin'), deleteUser);
router.post('/trigger-sync', authenticate, roleGuard('admin'), triggerGlobalSync);
router.get('/sync-jobs/:jobId', authenticate, roleGuard('admin'), getGlobalSyncJobStatus);

export default router;

