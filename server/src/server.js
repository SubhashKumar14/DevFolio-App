import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import { startSyncJobWorker } from './services/syncJobQueue.js';

const startServer = async () => {
  // Only advertise an available HTTP service after its required DB is ready.
  await connectDB();

  // Importing the scheduler registers the cron task. Do this after DB startup.
  await import('./cron/scheduler.js');
  startSyncJobWorker();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(` DevFolio API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
