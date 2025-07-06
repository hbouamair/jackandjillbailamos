import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/judges/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    const judge = await prisma.judge.findUnique({ 
      where: { id },
      include: { user: true }
    });
    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    // Convert Prisma enum values back to frontend format
    const formattedJudge = {
      ...judge,
      role: judge.role.toLowerCase() as 'leader' | 'follower'
    };
    
    return NextResponse.json(formattedJudge);
  } catch (error) {
    console.error('Error fetching judge:', error);
    return NextResponse.json({ error: 'Failed to fetch judge' }, { status: 500 });
  }
}

// PUT /api/judges/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    const data = await req.json();
    
    // Get the judge to find the associated user
    const judge = await prisma.judge.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    // Convert frontend role to Prisma enum format if role is being updated
    if (data.role) {
      const prismaRole = data.role.toUpperCase() as 'LEADER' | 'FOLLOWER';
      if (!['LEADER', 'FOLLOWER'].includes(prismaRole)) {
        return NextResponse.json({ error: 'Invalid role. Must be "leader" or "follower"' }, { status: 400 });
      }
      data.role = prismaRole;
    }
    
    // Update both User and Judge records
    const updatePromises = [];
    
    // Update User record
    if (data.name || data.username || data.password || data.role) {
      updatePromises.push(
        prisma.user.update({
          where: { id: judge.userId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.username && { username: data.username }),
            ...(data.password && { password: data.password }),
            ...(data.role && { role: data.role })
          }
        })
      );
    }
    
    // Update Judge record
    updatePromises.push(
      prisma.judge.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.role && { role: data.role }),
          ...(data.username && { username: data.username }),
          ...(data.password && { password: data.password })
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    // Get updated judge
    const updatedJudge = await prisma.judge.findUnique({
      where: { id },
      include: { user: true }
    });
    
    // Convert back to frontend format
    const formattedJudge = {
      ...updatedJudge,
      role: updatedJudge!.role.toLowerCase() as 'leader' | 'follower'
    };
    
    return NextResponse.json(formattedJudge);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Judge not found or update failed' }, { status: 400 });
  }
}

// DELETE /api/judges/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { id } = params;
    
    // Get the judge to find the associated user
    const judge = await prisma.judge.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    // Delete both Judge and User records
    await prisma.judge.delete({ where: { id } });
    await prisma.user.delete({ where: { id: judge.userId } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Judge not found or delete failed' }, { status: 400 });
  }
} 