import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/judges
export async function GET() {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const judges = await prisma.judge.findMany({
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    
    // Convert Prisma enum values back to frontend format
    const formattedJudges = judges.map(judge => ({
      ...judge,
      role: judge.role.toLowerCase() as 'leader' | 'follower'
    }));
    
    return NextResponse.json(formattedJudges);
  } catch (error) {
    console.error('Error fetching judges:', error);
    return NextResponse.json({ error: 'Failed to fetch judges' }, { status: 500 });
  }
}

// POST /api/judges
export async function POST(req: NextRequest) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const data = await req.json();
    const { name, role, username, password } = data;
    
    if (!name || !role || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Convert frontend role to Prisma enum format
    const prismaRole = role.toUpperCase() as 'LEADER' | 'FOLLOWER';
    
    if (!['LEADER', 'FOLLOWER'].includes(prismaRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be "leader" or "follower"' }, { status: 400 });
    }
    
    // First create the User record
    const user = await prisma.user.create({
      data: {
        username,
        password,
        type: 'JUDGE',
        name,
        role: prismaRole
      }
    });
    
    // Then create the Judge record with the userId
    const judge = await prisma.judge.create({
      data: { 
        name, 
        role: prismaRole, 
        username, 
        password, 
        userId: user.id
      }
    });
    
    // Convert back to frontend format
    const formattedJudge = {
      ...judge,
      role: judge.role.toLowerCase() as 'leader' | 'follower'
    };
    
    return NextResponse.json(formattedJudge);
  } catch (error: any) {
    console.error('Error creating judge:', error);
    // If there's an error, try to clean up the user if it was created
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create judge' }, { status: 500 });
  }
} 