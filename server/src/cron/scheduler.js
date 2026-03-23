import cron from 'node-cron';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { computeDevScore } from '../utils/devScoreCalculator.js';

/**
 * Nightly sync cron job — runs at 2:00 AM every day.
 * Syncs GitHub + DSA stats for all users with connected platforms.
 * Recomputes DevScore after sync.
 * NOTE: PortfolioCode is explicitly EXCLUDED from sync.
 */
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Starting nightly sync...');

  try {
    const users = await User.find({
      $or: [
        { githubUsername: { $ne: null } },
        { leetcodeUsername: { $ne: null } },
        { codeforcesUsername: { $ne: null } },
      ],
    }).select('+githubAccessToken');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Sync GitHub stats
        if (user.githubUsername) {
          const stats = await fetchGithubStats(user.githubUsername, user.githubAccessToken);
          await GithubStats.findOneAndUpdate(
            { userId: user._id },
            { ...stats, userId: user._id },
            { upsert: true }
          );
        }

        // Sync LeetCode stats
        if (user.leetcodeUsername) {
          const stats = await fetchLeetcodeStats(user.leetcodeUsername);
          await DsaStats.findOneAndUpdate(
            { userId: user._id },
            { leetcode: stats, lastSyncedAt: new Date(), userId: user._id },
            { upsert: true }
          );
        }

        // Sync Codeforces stats
        if (user.codeforcesUsername) {
          const stats = await fetchCodeforcesStats(user.codeforcesUsername);
          await DsaStats.findOneAndUpdate(
            { userId: user._id },
            { codeforces: stats, lastSyncedAt: new Date() },
            { upsert: true }
          );
        }

        // Recompute DevScore (portfolio excluded from sync, but used in computation)
        const githubStats = await GithubStats.findOne({ userId: user._id });
        const dsaStats = await DsaStats.findOne({ userId: user._id });
        const portfolio = await PortfolioCode.findOne({ userId: user._id });

        const scoreResult = computeDevScore(githubStats, dsaStats, portfolio);
        await DevScore.create({
          userId: user._id,
          ...scoreResult,
          computedAt: new Date(),
        });

        successCount++;
      } catch (error) {
        console.error(`❌ Sync failed for user ${user._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Nightly sync complete: ${successCount} synced, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Nightly sync job failed:', error.message);
  }
});

console.log('⏰ Cron scheduler initialized (nightly sync at 2:00 AM)');
