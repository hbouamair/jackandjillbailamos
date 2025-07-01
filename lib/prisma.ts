import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Initialize Prisma client with error handling for build time
if (process.env.NODE_ENV === 'production') {
  // In production, always try to initialize
  prisma = new PrismaClient();
} else {
  // In development, handle initialization errors gracefully
  try {
    prisma = new PrismaClient();
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    // Create a mock client for build time
    prisma = {} as PrismaClient;
  }
}

export default prisma; 