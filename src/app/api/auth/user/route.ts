import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  // Get cookies explicitly - this automatically makes the route dynamic
  const cookieStore = cookies();
  
  try {
    const user = await getUserFromRequest();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only send necessary user data
    return NextResponse.json({
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 