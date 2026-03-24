import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';
import Profile from '../models/Profile.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/user/search?q=name
 * Search users by displayName (public, no auth required)
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const users = await User.find({
    displayName: { $regex: q, $options: 'i' },
  })
    .select('_id displayName email')
    .limit(10);

  // Get profiles for avatars
  const userIds = users.map((u) => u._id);
  const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId avatarUrl college');
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const results = users.map((u) => ({
    _id: u._id,
    displayName: u.displayName,
    avatarUrl: profileMap.get(u._id.toString())?.avatarUrl || null,
    college: profileMap.get(u._id.toString())?.college || '',
  }));

  res.json({ success: true, data: results });
});
