import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';

// ─── Route Imports ──────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import compareRoutes from './routes/compareRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

// ─── Middleware Imports ─────────────────────────────────
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { csrfOriginProtection } from './middleware/csrfOriginProtection.js';

// ─── Express App ────────────────────────────────────────
const app = express();

// ─── Global Middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ──────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/', csrfOriginProtection);

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/user', exportRoutes);

// ─── Static Files (Uploads) ────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Error Handling (must be last) ─────────────────────
app.use(errorHandler);

export default app;
