import axios from 'axios';

/**
 * Fetch Hugging Face profile stats via public API.
 * @param {string} username
 */
export async function fetchHuggingfaceStats(username) {
  try {
    // Fetch user's models
    const [modelsRes, datasetsRes, spacesRes] = await Promise.all([
      axios.get(`https://huggingface.co/api/models?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
      axios.get(`https://huggingface.co/api/datasets?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
      axios.get(`https://huggingface.co/api/spaces?author=${username}&limit=100`, { timeout: 10000 }).catch(() => ({ data: [] })),
    ]);

    const models = modelsRes.data || [];
    const datasets = datasetsRes.data || [];
    const spaces = spacesRes.data || [];

    // Compute aggregate stats
    const totalLikes = models.reduce((sum, m) => sum + (m.likes || 0), 0)
      + datasets.reduce((sum, d) => sum + (d.likes || 0), 0)
      + spaces.reduce((sum, s) => sum + (s.likes || 0), 0);

    const totalDownloads = models.reduce((sum, m) => sum + (m.downloads || 0), 0)
      + datasets.reduce((sum, d) => sum + (d.downloads || 0), 0);

    return {
      username,
      modelsPublished: models.length,
      datasetsPublished: datasets.length,
      spacesCreated: spaces.length,
      totalLikes,
      totalDownloads,
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
      modelsPublished: 0, datasetsPublished: 0, spacesCreated: 0,
      totalLikes: 0, totalDownloads: 0, topModels: [],
      profileUrl: `https://huggingface.co/${username}`,
    };
  }
}
