import { fetchAllUpcomingContests } from '../services/contestService.js';
import { cacheGet } from '../config/redisClient.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getUpcomingContests = asyncHandler(async (req, res) => {
  const contests = await cacheGet(
    'contests:upcoming',
    () => fetchAllUpcomingContests(),
    3600 // 1 hour TTL
  );

  res.json({ success: true, data: contests });
});
