import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', authenticate, getProjects);
router.post('/', authenticate, createProject);
router.put('/:projectId', authenticate, updateProject);
router.delete('/:projectId', authenticate, deleteProject);

export default router;
