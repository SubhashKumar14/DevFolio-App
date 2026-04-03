import cron from 'node-cron';
import { acquireLock, releaseLock, NO_LOCK_BACKEND } from '../config/redisClient.js';
import { enqueueGlobalSyncJob } from '../services/syncJobQueue.js';

cron.schedule('0 2 * * *', async () => {
  const lockKey = 'cron:nightly-sync:all-platforms';
  const lockToken = await acquireLock(lockKey, 15 * 60);

  if (lockToken === null) {
    console.log('[cron] Skipping nightly sync enqueue: lock is held by another instance');
    return;
  }

  if (lockToken === NO_LOCK_BACKEND) {
    console.log('[cron] Nightly sync enqueue running without distributed lock (Redis unavailable)');
  }

  try {
    const job = await enqueueGlobalSyncJob({
      requestedBy: null,
      meta: { source: 'cron' },
    });

    console.log(`[cron] Nightly global sync queued (job ${job.jobId})`);
  } catch (error) {
    console.error('[cron] Failed to enqueue nightly sync job:', error.message);
  } finally {
    await releaseLock(lockKey, lockToken);
  }
});

console.log('[cron] Scheduler initialized (nightly sync queue at 2:00 AM)');
