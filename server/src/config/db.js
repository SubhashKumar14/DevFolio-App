import mongoose from 'mongoose';
import env from './env.js';

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

export default connectDB;
