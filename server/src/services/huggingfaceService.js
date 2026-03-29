import axios from 'axios';

/**
 * Fetch Hugging Face profile stats via public API.
 * @param {string} username
 */
export async function fetchHuggingfaceStats(username) {
  try {
    const [modelsRes, datasetsRes, spacesRes, profileRes, overviewRes] = await Promise.all([
      axios.get(`https://huggingface.co/api/models?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
      axios.get(`https://huggingface.co/api/datasets?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
      axios.get(`https://huggingface.co/api/spaces?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
      axios.get(`https://huggingface.co/api/users/${username}`, { timeout: 10000 }).catch(() => ({ data: {} })),
      axios.get(`https://huggingface.co/api/users/${username}/overview`, { timeout: 10000 }).catch(() => ({ data: {} })),
    ]);

    const models = modelsRes.data || [];
    const datasets = datasetsRes.data || [];
    const spaces = spacesRes.data || [];
    const profile = profileRes.data || {};
    const overview = overviewRes.data || {};

    const modelDownloads = models.reduce((sum, m) => sum + (m.downloads || 0), 0);
    const datasetDownloads = datasets.reduce((sum, d) => sum + (d.downloads || 0), 0);
    const spacesLikes = spaces.reduce((sum, s) => sum + (s.likes || 0), 0);
    const totalLikes = models.reduce((sum, m) => sum + (m.likes || 0), 0)
      + datasets.reduce((sum, d) => sum + (d.likes || 0), 0)
      + spacesLikes;

    const followers = Number(profile?.numFollowers ?? overview?.numFollowers ?? profile?.followers ?? 0) || 0;
    const following = Number(profile?.numFollowing ?? overview?.numFollowing ?? profile?.following ?? 0) || 0;
    const organizations = Array.isArray(profile?.orgs)
      ? profile.orgs.map((org) => org?.name || org?.id).filter(Boolean)
      : [];

    return {
      username,
      modelsPublished: models.length,
      modelDownloads,
      datasetsPublished: datasets.length,
      datasetDownloads,
      spacesCreated: spaces.length,
      spacesLikes,
      followers,
      following,
      organizations,
      totalLikes,
      totalDownloads: modelDownloads + datasetDownloads,
      topModels: models.slice(0, 5).map(m => ({
        name: m.id || m.modelId || '',
        likes: m.likes || 0,
        downloads: m.downloads || 0,
        pipeline: m.pipeline_tag || '',
      })),
      profileUrl: `https://huggingface.co/${username}`,
    };
  } catch (err) {
    console.warn(`Hugging Face fetch failed for ${username}:`, err.message);
    return {
      username,
      modelsPublished: 0,
      modelDownloads: 0,
      datasetsPublished: 0,
      datasetDownloads: 0,
      spacesCreated: 0,
      spacesLikes: 0,
      followers: 0,
      following: 0,
      organizations: [],
      totalLikes: 0,
      totalDownloads: 0,
      topModels: [],
      profileUrl: `https://huggingface.co/${username}`,
    };
  }
}
