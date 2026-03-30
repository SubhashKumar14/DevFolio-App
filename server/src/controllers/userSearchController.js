import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { normalizeSearchTerm } from '../utils/inputValidation.js';

/**
 * GET /api/user/search?q=name
 * Search users by displayName (public, no auth required)
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const normalizedQuery = normalizeSearchTerm(req.query.q, { minLength: 2, maxLength: 64 });
  if (!normalizedQuery) {
    return res.json({ success: true, data: [] });
  }

  const users = await User.find({
    displayName: { $regex: normalizedQuery, $options: 'i' },
  })
    .select('_id displayName')
    .limit(10);

  // Only public profiles should be discoverable on this surface.
  const userIds = users.map((u) => u._id);
  const profiles = await Profile.find({ userId: { $in: userIds }, isPublic: true }).select('userId avatarUrl college');
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const results = users
    .filter((u) => profileMap.has(u._id.toString()))
    .map((u) => ({
      _id: u._id,
      displayName: u.displayName,
      avatarUrl: profileMap.get(u._id.toString())?.avatarUrl || null,
      college: profileMap.get(u._id.toString())?.college || '',
    }));

  res.json({ success: true, data: results });
});
