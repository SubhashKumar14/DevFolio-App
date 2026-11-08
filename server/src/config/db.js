import mongoose from 'mongoose';
import env from './env.js';
import { describeMongoConnectionError } from './mongoConnectionDiagnostics.js';

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    // Let the application entrypoint decide how to terminate startup.
    // Do not log a connection string: it may contain database credentials.
    throw new Error(describeMongoConnectionError(error, env.MONGODB_URI), { cause: error });
  }
}

export default connectDB;
