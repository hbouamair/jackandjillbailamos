import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Always create a Prisma client instance
// The client will handle connection errors gracefully
prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
    }
  }
});

export default prisma; 