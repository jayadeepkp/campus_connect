import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.error('Missing MONGO_URI');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Check SRV string, password URL-encoding, and Atlas IP allowlist.');
    process.exit(1);
  }
}