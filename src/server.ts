import app from './app';
import { config } from './config';
import mongoose from 'mongoose';
import { dataStore } from './utils/dataStore';

const PORT = config.port;

const startServer = async () => {
  // Connect to MongoDB with a short timeout so server does not hang if no local DB
  try {
    console.log('Connecting to MongoDB Atlas / Local URI...');
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('✅ Connected to MongoDB successfully.');
    dataStore.setMongoConnected(true);
  } catch (err: any) {
    console.warn(
      '⚠️ MongoDB connection unavailable or timed out. Falling back to High-Performance Resilient Memory Store with pre-seeded demo dataset.'
    );
    dataStore.setMongoConnected(false);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 DropOfLife Backend Server running on http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🩸 Demo Credentials:`);
    console.log(`   - Admin:    admin@dropoflife.org    / Admin@123`);
    console.log(`   - Donor:    donor@dropoflife.org    / Donor@123`);
    console.log(`   - Hospital: hospital@dropoflife.org / Hospital@123`);
  });

  return server;
};

startServer();
