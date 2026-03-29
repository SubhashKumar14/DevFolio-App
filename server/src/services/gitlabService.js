import axios from 'axios';

/**
 * Fetch GitLab profile stats via official API v4.
 * @param {string} username
 */
export async function fetchGitlabStats(username) {
  try {
    // Fetch user by username
    const usersRes = await axios.get(
      `https://gitlab.com/api/v4/users?username=${username}`,
      { timeout: 10000 }
    );

    const users = usersRes.data || [];
    if (users.length === 0) {
      throw new Error('GitLab user not found');
    }

    const user = users[0];
    const userId = user.id;

    // Fetch user's public projects
    const projectsRes = await axios.get(
      `https://gitlab.com/api/v4/users/${userId}/projects?visibility=public&per_page=100&order_by=updated_at`,
      { timeout: 10000 }
    );

    const projects = projectsRes.data || [];

    // Aggregate stats
    const totalStars = projects.reduce((sum, p) => sum + (p.star_count || 0), 0);
    const totalForks = projects.reduce((sum, p) => sum + (p.forks_count || 0), 0);

    // Extract languages
    const languageMap = {};
    projects.forEach(p => {
      if (p.language) {
        languageMap[p.language] = (languageMap[p.language] || 0) + 1;
      }
    });
    const languages = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      username,
      name: user.name || '',
      avatarUrl: user.avatar_url || '',
      projectsCount: projects.length,
      totalStars,
      totalForks,
      languages,
      topProjects: projects.slice(0, 5).map(p => ({
        name: p.name || '',
        description: p.description || '',
        stars: p.star_count || 0,
        forks: p.forks_count || 0,
        language: p.language || '',
        url: p.web_url || '',
      })),
      profileUrl: user.web_url || `https://gitlab.com/${username}`,
    };
  } catch (err) {
    console.warn(`GitLab fetch failed for ${username}:`, err.message);
    return {
      username,
      name: '', avatarUrl: '',
      projectsCount: 0, totalStars: 0, totalForks: 0,
      languages: [], topProjects: [],
      profileUrl: `https://gitlab.com/${username}`,
    };
  }
}
