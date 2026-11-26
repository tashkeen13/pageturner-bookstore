import mongoose from 'mongoose';

/**
 * Connect to MongoDB before starting the HTTP server.
 */
export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is missing. Add it to server/.env.');
  }
  await mongoose.connect(uri);
}
