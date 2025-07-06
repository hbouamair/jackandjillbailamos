import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/participants
export async function GET() {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const participants = await prisma.participant.findMany({
      orderBy: { number: 'asc' }
    });
    
    // Convert Prisma enum values back to frontend format
    const formattedParticipants = participants.map(participant => ({
      ...participant,
      role: participant.role.toLowerCase() as 'leader' | 'follower'
    }));
    
    return NextResponse.json(formattedParticipants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

// POST /api/participants
export async function POST(req: NextRequest) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

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
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
  }
} 