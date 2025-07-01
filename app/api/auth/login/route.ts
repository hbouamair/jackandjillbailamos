import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { username, password } = data;
  
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
  }
  
  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    // Check password (in a real app, you'd hash passwords)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    // Convert Prisma enum values back to frontend format
    const formattedUser = {
      id: user.id,
      username: user.username,
      type: user.type.toLowerCase() as 'admin' | 'judge' | 'mc',
      name: user.name,
      role: user.role ? user.role.toLowerCase() as 'leader' | 'follower' : undefined
    };
    
    return NextResponse.json({ 
      user: formattedUser,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
} 