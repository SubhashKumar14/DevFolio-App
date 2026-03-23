import DevScore from '../models/DevScore.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { computeDevScore } from '../utils/devScoreCalculator.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Current DevScore ─────────────────────────
export const getScore = asyncHandler(async (req, res) => {
  const score = await DevScore.findOne({ userId: req.params.userId })
    .sort({ createdAt: -1 });

  if (!score) {
    throw new AppError('DevScore not found', 404);
  }

  res.json({ success: true, data: score });
});

// ─── Get Score History ────────────────────────────
export const getScoreHistory = asyncHandler(async (req, res) => {
  const scores = await DevScore.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('overallScore computedAt createdAt');

  res.json({ success: true, data: scores.reverse() });
});

// ─── Recompute DevScore ───────────────────────────
export const recomputeScore = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const githubStats = await GithubStats.findOne({ userId });
  const dsaStats = await DsaStats.findOne({ userId });
  const portfolio = await PortfolioCode.findOne({ userId });

  const scoreResult = computeDevScore(githubStats, dsaStats, portfolio);

  const newScore = await DevScore.create({
    userId,
    ...scoreResult,
    computedAt: new Date(),
  });

  res.json({ success: true, data: newScore });
});
