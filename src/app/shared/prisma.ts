import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_0XIlEoL3MWQi@ep-empty-cherry-b3u7mae5-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) {
  process.env.DATABASE_URL = NEON_DATABASE_URL;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      config.nodeEnv === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (config.nodeEnv !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
