import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    // Check if database URL is available
    if (!process.env.POSTGRES_URL) {
      console.error('POSTGRES_URL environment variable is not set');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 503 });
    }

    const data = await req.json();
    const { username, password } = data;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }
    
    // Find user by username with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { username }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return NextResponse.json({ error: 'Database connection error' }, { status: 503 });
    }
    
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