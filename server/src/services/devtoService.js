import axios from 'axios';

/**
 * Fetch Dev.to profile stats via official API.
 * @param {string} username
 */
export async function fetchDevtoStats(username) {
  try {
    // Fetch user profile
    const userRes = await axios.get(
      `https://dev.to/api/users/by_username?url=${username}`,
      { timeout: 10000 }
    );

    const user = userRes.data || {};

    // Fetch published articles
    const articlesRes = await axios.get(
      `https://dev.to/api/articles?username=${username}&per_page=100`,
      { timeout: 10000 }
    );

    const articles = articlesRes.data || [];

    // Aggregate stats
    const totalReactions = articles.reduce((sum, a) => sum + (a.positive_reactions_count || 0), 0);
    const totalComments = articles.reduce((sum, a) => sum + (a.comments_count || 0), 0);
    const totalReadingTime = articles.reduce((sum, a) => sum + (a.reading_time_minutes || 0), 0);

    // Extract unique tags
    const tagSet = new Set();
    articles.forEach(a => {
      (a.tag_list || []).forEach(tag => tagSet.add(tag));
    });

    return {
      username,
      name: user.name || '',
      followers: user.followers_count || 0,
      joinedAt: user.joined_at || null,
      articlesPublished: articles.length,
      totalReactions,
      totalComments,
      totalReadingTimeMinutes: totalReadingTime,
      tags: Array.from(tagSet).slice(0, 20),
      topArticles: articles.slice(0, 5).map(a => ({
        title: a.title || '',
        url: a.url || '',
        reactions: a.positive_reactions_count || 0,
        comments: a.comments_count || 0,
        publishedAt: a.published_at || '',
      })),
      profileUrl: `https://dev.to/${username}`,
    };
  } catch (err) {
    console.warn(`Dev.to fetch failed for ${username}:`, err.message);
    return {
      username,
      name: '', followers: 0, joinedAt: null,
      articlesPublished: 0, totalReactions: 0, totalComments: 0,
      totalReadingTimeMinutes: 0, tags: [], topArticles: [],
      profileUrl: `https://dev.to/${username}`,
    };
  }
}
