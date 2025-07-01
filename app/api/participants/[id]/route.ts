import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/participants/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Convert Prisma enum values back to frontend format
    const formattedParticipant = {
      ...participant,
      role: participant.role.toLowerCase() as 'leader' | 'follower'
    };
    
    return NextResponse.json(formattedParticipant);
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json({ error: 'Failed to fetch participant' }, { status: 500 });
  }
}

// PUT /api/participants/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    const data = await req.json();
    
    // Convert frontend role to Prisma enum format if role is being updated
    if (data.role) {
      const prismaRole = data.role.toUpperCase() as 'LEADER' | 'FOLLOWER';
      if (!['LEADER', 'FOLLOWER'].includes(prismaRole)) {
        return NextResponse.json({ error: 'Invalid role. Must be "leader" or "follower"' }, { status: 400 });
      }
      data.role = prismaRole;
    }
    
    // Convert number to integer if provided
    if (data.number) {
      data.number = parseInt(data.number);
    }
    
    const participant = await prisma.participant.update({
      where: { id },
      data
    });
    
    // Convert back to frontend format
    const formattedParticipant = {
      ...participant,
      role: participant.role.toLowerCase() as 'leader' | 'follower'
    };
    
    return NextResponse.json(formattedParticipant);
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: 'Participant not found or update failed' }, { status: 400 });
  }
}

// DELETE /api/participants/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    await prisma.participant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json({ error: 'Participant not found or delete failed' }, { status: 400 });
  }
} 