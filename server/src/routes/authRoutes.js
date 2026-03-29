import { Router } from 'express';
import { register, login, refreshToken, logout, githubRedirect, githubCallback, linkGithub } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.post('/logout', authenticate, logout);

// GitHub OAuth
router.get('/github', githubRedirect);
router.get('/github/callback', githubCallback);
router.post('/github/link', authenticate, linkGithub);

export default router;
