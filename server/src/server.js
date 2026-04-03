import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import './cron/scheduler.js';
import { startSyncJobWorker } from './services/syncJobQueue.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start background workers
  startSyncJobWorker();

  // Start Express server
  app.listen(env.PORT, () => {
    console.log(` DevFolio API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
