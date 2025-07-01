import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/participants
export async function GET() {
  const participants = await prisma.participant.findMany({
    orderBy: { number: 'asc' }
  });
  
  // Convert Prisma enum values back to frontend format
  const formattedParticipants = participants.map(participant => ({
    ...participant,
    role: participant.role.toLowerCase() as 'leader' | 'follower'
  }));
  
  return NextResponse.json(formattedParticipants);
}

// POST /api/participants
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, role, number, pictureUrl } = data;
  
  if (!name || !role || !number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Convert frontend role to Prisma enum format
  const prismaRole = role.toUpperCase() as 'LEADER' | 'FOLLOWER';
  
  if (!['LEADER', 'FOLLOWER'].includes(prismaRole)) {
    return NextResponse.json({ error: 'Invalid role. Must be "leader" or "follower"' }, { status: 400 });
  }
  
  const participant = await prisma.participant.create({
    data: { 
      name, 
      role: prismaRole, 
      number: parseInt(number),
      pictureUrl: pictureUrl || null
    }
  });
  
  // Convert back to frontend format
  const formattedParticipant = {
    ...participant,
    role: participant.role.toLowerCase() as 'leader' | 'follower'
  };
  
  return NextResponse.json(formattedParticipant);
} 