import app from './app';
import { config } from './config';
import mongoose from 'mongoose';
import { dataStore } from './utils/dataStore';
import prisma from './app/shared/prisma';
import { logger } from './app/utils/logger';


const PORT = Number(process.env.PORT) || Number(config.port) || 5050;

const startServer = async () => {
  // 1. Connect to PostgreSQL via Prisma ORM
  try {
    console.log('Connecting to PostgreSQL via Prisma ORM...');
    await prisma.$connect();
    console.log('🐘 Connected to PostgreSQL successfully via Prisma.');
    await dataStore.syncWithPrisma();
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 DropOfLife Backend Server running on port ${PORT}`);
    logger.info(`📖 Swagger API Documentation: http://localhost:${PORT}/docs`);
    logger.info(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🚀 DropOfLife Backend Server running on http://localhost:${PORT}`);
    console.log(`📖 Swagger API Documentation: http://localhost:${PORT}/docs`);
    console.log(`📋 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🐘 Database: PostgreSQL (Prisma ORM) & MongoDB (Resilient Store)`);
  });

  // Graceful Shutdown for Cloud Deployments (Docker, Render, Railway, K8s)
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal}. Gracefully closing HTTP server and database connections...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected.');
      } catch (e) {}
      try {
        await mongoose.connection.close();
        logger.info('Mongoose disconnected.');
      } catch (e) {}
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection:', { reason: reason?.stack || reason });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception thrown:', { error: error.stack || error.message });
    process.exit(1);
  });

  return server;
};

startServer();

