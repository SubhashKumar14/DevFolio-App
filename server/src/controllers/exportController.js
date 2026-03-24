import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';
import Profile from '../models/Profile.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/user/export - Export all user data as JSON (GDPR-compliant)
 */
export const exportUserData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, profile, githubStats, dsaStats, platformStats, devScores, portfolio] = await Promise.all([
    User.findById(userId).select('-refreshToken -__v'),
    Profile.findOne({ userId }).select('-__v'),
    GithubStats.findOne({ userId }).select('-__v'),
    DsaStats.findOne({ userId }).select('-__v'),
    PlatformStats.findOne({ userId }).select('-__v'),
    DevScore.find({ userId }).sort({ computedAt: -1 }).limit(30).select('-__v'),
    PortfolioCode.findOne({ userId }).select('-__v'),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: user?.toObject(),
    profile: profile?.toObject(),
    githubStats: githubStats?.toObject(),
    dsaStats: dsaStats?.toObject(),
    platformStats: platformStats?.toObject(),
    devScoreHistory: devScores.map((s) => s.toObject()),
    portfolio: portfolio ? {
      isPublic: portfolio.isPublic,
      hasCode: !!(portfolio.htmlContent || portfolio.rawHtml),
    } : null,
  };

  res.setHeader('Content-Disposition', `attachment; filename=devfolio-export-${Date.now()}.json`);
  res.json({ success: true, data: exportData });
});
