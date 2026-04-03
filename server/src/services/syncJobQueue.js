import SyncJob from '../models/SyncJob.js';
import { runGlobalSync, syncSingleUser } from './syncOrchestrator.js';

const WORKER_INTERVAL_MS = 1200;

let workerStarted = false;
let workerBusy = false;
let workerTimer = null;

function normalizeObjectId(value) {
  return value?.toString?.() || null;
}

export function serializeSyncJob(job) {
  if (!job) return null;

  return {
    jobId: normalizeObjectId(job._id),
    type: job.type,
    status: job.status,
    requestedBy: normalizeObjectId(job.requestedBy),
    targetUserId: normalizeObjectId(job.targetUserId),
    totalTargets: Number(job.totalTargets || 0),
    processedTargets: Number(job.processedTargets || 0),
    successCount: Number(job.successCount || 0),
    errorCount: Number(job.errorCount || 0),
    message: job.message || '',
    errorMessage: job.errorMessage || '',
    startedAt: job.startedAt || null,
    finishedAt: job.finishedAt || null,
    createdAt: job.createdAt || null,
    updatedAt: job.updatedAt || null,
    meta: job.meta || {},
  };
}

export async function getSyncJobSnapshot(jobId) {
  const job = await SyncJob.findById(jobId).lean();
  return job ? serializeSyncJob(job) : null;
}

export async function enqueueUserSyncJob({ targetUserId, requestedBy = null, meta = {} }) {
  const job = await SyncJob.create({
    type: 'user-sync',
    status: 'queued',
    requestedBy,
    targetUserId,
    totalTargets: 1,
    processedTargets: 0,
    successCount: 0,
    errorCount: 0,
    message: 'User sync job queued',
    meta,
  });

  startSyncJobWorker();

  return serializeSyncJob(job);
}

export async function enqueueGlobalSyncJob({ requestedBy = null, meta = {} }) {
  const job = await SyncJob.create({
    type: 'global-sync',
    status: 'queued',
    requestedBy,
    totalTargets: 0,
    processedTargets: 0,
    successCount: 0,
    errorCount: 0,
    message: 'Global sync job queued',
    meta,
  });

  startSyncJobWorker();

  return serializeSyncJob(job);
}

async function completeJob(jobId, updates = {}) {
  const updated = await SyncJob.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: 'completed',
        finishedAt: new Date(),
        ...updates,
      },
    },
    { returnDocument: 'after' }
  ).lean();

  return serializeSyncJob(updated);
}

async function failJob(jobId, errorMessage, updates = {}) {
  const updated = await SyncJob.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage: String(errorMessage || 'Sync job failed'),
        ...updates,
      },
    },
    { returnDocument: 'after' }
  ).lean();

  return serializeSyncJob(updated);
}

async function processUserSyncJob(job) {
  try {
    const result = await syncSingleUser(job.targetUserId, { invalidateLeaderboard: true });
    const errorCount = result.errors.length;

    const message = errorCount > 0
      ? `User sync completed with ${errorCount} warning(s)`
      : `Sync complete: ${result.syncedPlatforms.join(', ') || 'no platforms connected'}`;

    await completeJob(job._id, {
      totalTargets: 1,
      processedTargets: 1,
      successCount: errorCount > 0 ? 0 : 1,
      errorCount,
      message,
      meta: {
        ...(job.meta || {}),
        syncedPlatforms: result.syncedPlatforms,
        warnings: result.errors,
      },
    });
  } catch (error) {
    await failJob(job._id, error.message, {
      totalTargets: 1,
      processedTargets: 1,
      successCount: 0,
      errorCount: 1,
      message: 'User sync failed',
    });
  }
}

async function processGlobalSyncJob(job) {
  let lastProgressPersistAt = 0;

  try {
    const result = await runGlobalSync({
      onProgress: async (progress) => {
        const now = Date.now();
        const shouldPersist = progress.processedTargets === progress.totalTargets || now - lastProgressPersistAt > 2000;

        if (!shouldPersist) return;

        lastProgressPersistAt = now;

        await SyncJob.findByIdAndUpdate(job._id, {
          $set: {
            totalTargets: progress.totalTargets,
            processedTargets: progress.processedTargets,
            successCount: progress.successCount,
            errorCount: progress.errorCount,
            message: `Global sync running: ${progress.processedTargets}/${progress.totalTargets}`,
          },
        });
      },
    });

    await completeJob(job._id, {
      totalTargets: result.totalTargets,
      processedTargets: result.processedTargets,
      successCount: result.successCount,
      errorCount: result.errorCount,
      message: `Global sync complete: ${result.successCount} synced, ${result.errorCount} errors`,
      meta: {
        ...(job.meta || {}),
        sampleErrors: result.errors,
      },
    });
  } catch (error) {
    await failJob(job._id, error.message, {
      message: 'Global sync failed',
    });
  }
}

async function processNextSyncJob() {
  if (workerBusy) return;

  workerBusy = true;

  try {
    const job = await SyncJob.findOneAndUpdate(
      { status: 'queued' },
      { $set: { status: 'running', startedAt: new Date(), message: 'Sync job started' } },
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );

    if (!job) {
      return;
    }

    if (job.type === 'user-sync') {
      await processUserSyncJob(job);
      return;
    }

    if (job.type === 'global-sync') {
      await processGlobalSyncJob(job);
      return;
    }

    await failJob(job._id, `Unsupported job type: ${job.type}`);
  } finally {
    workerBusy = false;
  }
}

export function startSyncJobWorker() {
  if (workerStarted) return;

  workerStarted = true;

  const runTick = () => {
    void processNextSyncJob().catch((error) => {
      console.error('Sync job worker tick failed:', error.message);
    });
  };

  workerTimer = setInterval(() => {
    runTick();
  }, WORKER_INTERVAL_MS);

  if (typeof workerTimer.unref === 'function') {
    workerTimer.unref();
  }

  runTick();
}
