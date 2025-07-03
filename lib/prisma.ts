import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Always create a Prisma client instance
// The client will handle connection errors gracefully
prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || 'postgres://postgres.rxrznqxcqfgoaqadnyqa:zp1tYA6bRnkzGe6P@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&supa=base-pooler.x?pgbouncer=true'
    }
  }
});

export default prisma; 