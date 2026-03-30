import Profile from '../models/Profile.js';
import { AppError } from '../middleware/errorHandler.js';

export function isOwner(requester, targetUserId) {
  if (!requester?._id || !targetUserId) return false;
  return String(requester._id) === String(targetUserId);
}

export async function assertPublicOrOwner({
  targetUserId,
  requester,
  errorMessage = 'This profile is private',
} = {}) {
  if (!targetUserId) {
    throw new AppError('User not found', 404);
  }

  if (isOwner(requester, targetUserId)) {
    return;
  }

  const profile = await Profile.findOne({ userId: targetUserId }).select('isPublic').lean();
  if (!profile?.isPublic) {
    throw new AppError(errorMessage, 403);
  }
}
