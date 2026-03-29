import mongoose from 'mongoose';

const uriLocal = 'mongodb://127.0.0.1:27017/devfolio';

async function test(uri, name) {
  try {
    await mongoose.connect(uri);
    console.log(`✅ ${name} connected`);
    await mongoose.connection.close();
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
  }
}

async function run() {
  await test(uriLocal, 'Local URI');
}
run();
