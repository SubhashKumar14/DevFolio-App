import axios from 'axios';

/**
 * Fetch Stack Overflow profile stats via official API v2.3.
 * @param {string} userId — numeric Stack Overflow user ID
 */
export async function fetchStackoverflowStats(userId) {
  try {
    const res = await axios.get(
      `https://api.stackexchange.com/2.3/users/${userId}?order=desc&sort=reputation&site=stackoverflow&filter=default`,
      { timeout: 10000 }
    );

    const user = res.data?.items?.[0];
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch top tags
    const tagsRes = await axios.get(
      `https://api.stackexchange.com/2.3/users/${userId}/top-answer-tags?site=stackoverflow&pagesize=10`,
      { timeout: 10000 }
    );

    const topTags = (tagsRes.data?.items || []).map(t => ({
      tag: t.tag_name,
      answerCount: t.answer_count || 0,
      answerScore: t.answer_score || 0,
    }));

    return {
      userId: String(userId),
      displayName: user.display_name || '',
      reputation: user.reputation || 0,
      goldBadges: user.badge_counts?.gold || 0,
      silverBadges: user.badge_counts?.silver || 0,
      bronzeBadges: user.badge_counts?.bronze || 0,
      totalBadges: (user.badge_counts?.gold || 0) + (user.badge_counts?.silver || 0) + (user.badge_counts?.bronze || 0),
      answerCount: user.answer_count || 0,
      questionCount: user.question_count || 0,
      reach: user.reach || 0,
      profileUrl: user.link || '',
      topTags,
      creationDate: user.creation_date ? new Date(user.creation_date * 1000).toISOString() : null,
    };
  } catch (err) {
    console.warn(`Stack Overflow fetch failed for ${userId}:`, err.message);
    return {
      userId: String(userId),
      displayName: '', reputation: 0,
      goldBadges: 0, silverBadges: 0, bronzeBadges: 0, totalBadges: 0,
      answerCount: 0, questionCount: 0, reach: 0,
      profileUrl: '', topTags: [], creationDate: null,
    };
  }
}
