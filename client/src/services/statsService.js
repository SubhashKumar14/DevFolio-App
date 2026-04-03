import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

const SYNC_POLL_INTERVAL_MS = 1500;
const SYNC_POLL_TIMEOUT_MS = 8 * 60 * 1000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForSyncJobCompletion(jobId, options = {}) {
  const intervalMs = Number(options.intervalMs) > 0 ? Number(options.intervalMs) : SYNC_POLL_INTERVAL_MS;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : SYNC_POLL_TIMEOUT_MS;
  const startedAt = Date.now();
  let latestJob = null;

  while (Date.now() - startedAt < timeoutMs) {
    latestJob = unwrapApiData(await apiClient.get(`/stats/sync/${jobId}`));
    const status = String(latestJob?.status || '').toLowerCase();

    if (status === 'completed') {
      return latestJob;
    }

    if (status === 'failed') {
      const error = new Error(latestJob?.errorMessage || latestJob?.message || 'Sync job failed');
      error.job = latestJob;
      throw error;
    }

    await wait(intervalMs);
  }

  const timeoutError = new Error('Sync is taking longer than expected. Please check status shortly.');
  timeoutError.job = latestJob;
  throw timeoutError;
}

export const statsService = {
  async getGithubStats(userId) {
    return unwrapApiData(await apiClient.get(`/stats/github/${userId}`));
  },

  async getDsaStats(userId) {
    return unwrapApiData(await apiClient.get(`/stats/dsa/${userId}`));
  },

  async getPlatformStats(userId) {
    return unwrapApiData(await apiClient.get(`/stats/platforms/${userId}`));
  },

  async syncStats() {
    return unwrapApiData(await apiClient.post('/stats/sync'));
  },

  async getSyncJobStatus(jobId) {
    return unwrapApiData(await apiClient.get(`/stats/sync/${jobId}`));
  },

  async syncStatsAndWait(options) {
    const job = await this.syncStats();

    if (!job?.jobId) {
      return job;
    }

    return waitForSyncJobCompletion(job.jobId, options);
  },
};
