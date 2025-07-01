import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Clear existing data
    await prisma.score.deleteMany();
    await prisma.judge.deleteMany();
    await prisma.user.deleteMany({ where: { type: 'JUDGE' } });
    await prisma.participant.deleteMany();
    await prisma.competitionState.deleteMany();
    await prisma.heat.deleteMany();

    // Create demo participants
    const participants = [];
    
    // Create 15 leaders
    for (let i = 1; i <= 15; i++) {
      const participant = await prisma.participant.create({
        data: {
          name: `Leader ${i}`,
          role: 'LEADER',
          number: i
        }
      });
      participants.push(participant);
    }
    
    // Create 15 followers
    for (let i = 1; i <= 15; i++) {
      const participant = await prisma.participant.create({
        data: {
          name: `Follower ${i}`,
          role: 'FOLLOWER',
          number: i
        }
      });
      participants.push(participant);
    }

    // Create demo judges with proper User records
    const judgeData = [
      { name: 'Judge 1', role: 'LEADER', username: 'judge1', password: 'judge123' },
      { name: 'Judge 2', role: 'LEADER', username: 'judge2', password: 'judge123' },
      { name: 'Judge 3', role: 'FOLLOWER', username: 'judge3', password: 'judge123' },
      { name: 'Judge 4', role: 'FOLLOWER', username: 'judge4', password: 'judge123' }
    ];

    for (const judgeInfo of judgeData) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { username: judgeInfo.username }
      });

      if (!user) {
        // Create User record if it doesn't exist
        user = await prisma.user.create({
          data: {
            username: judgeInfo.username,
            password: judgeInfo.password,
            type: 'JUDGE',
            name: judgeInfo.name,
            role: judgeInfo.role.toUpperCase() as 'LEADER' | 'FOLLOWER'
          }
        });
      }

      // Check if judge already exists
      const existingJudge = await prisma.judge.findUnique({
        where: { username: judgeInfo.username }
      });

      if (!existingJudge) {
        // Create Judge record if it doesn't exist
        await prisma.judge.create({
          data: {
            name: judgeInfo.name,
            role: judgeInfo.role.toUpperCase() as 'LEADER' | 'FOLLOWER',
            username: judgeInfo.username,
            password: judgeInfo.password,
            userId: user.id
          }
        });
      }
    }

    // Create admin user if it doesn't exist
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: 'admin123',
          type: 'ADMIN',
          name: 'Administrator'
        }
      });
    }

    // Create MC user if it doesn't exist
    const existingMC = await prisma.user.findUnique({
      where: { username: 'mc' }
    });

    if (!existingMC) {
      await prisma.user.create({
        data: {
          username: 'mc',
          password: 'mc123',
          type: 'MC',
          name: 'Master of Ceremonies'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo data created successfully',
      participants: participants.length,
      judges: judgeData.length
    });
  } catch (error) {
    console.error('Error creating demo data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create demo data' 
    }, { status: 500 });
  }
} 