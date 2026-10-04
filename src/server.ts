import app from './app';
import { config } from './config';
import mongoose from 'mongoose';
import { dataStore } from './utils/dataStore';
import prisma from './app/shared/prisma';

const PORT = config.port;

const startServer = async () => {
  // 1. Connect to PostgreSQL via Prisma ORM
  try {
    console.log('Connecting to PostgreSQL via Prisma ORM...');
    await prisma.$connect();
    console.log('🐘 Connected to PostgreSQL successfully via Prisma.');
  } catch (err: any) {
    console.warn(
      '⚠️ PostgreSQL connection via Prisma unavailable or deferred. High-Performance Resilient Store active.'
    );
  }

  // 2. Connect to MongoDB with short timeout fallback
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
    console.log(`📖 Swagger API Documentation: http://localhost:${PORT}/docs`);
    console.log(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🐘 Database: PostgreSQL (Prisma ORM) & MongoDB (Resilient Store)`);
    console.log(`🩸 Demo Credentials:`);
    console.log(`   - Admin:    admin@dropoflife.org    / Admin@123`);
    console.log(`   - Donor:    donor@dropoflife.org    / Donor@123`);
    console.log(`   - Hospital: hospital@dropoflife.org / Hospital@123`);
  });

  return server;
};

startServer();
