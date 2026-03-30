import { cacheInvalidate } from '../config/redisClient.js';

export async function invalidateLeaderboardCache() {
  await cacheInvalidate('leaderboard:mode:*');
  await cacheInvalidate('leaderboard:*');
}
