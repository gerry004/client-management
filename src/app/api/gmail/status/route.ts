import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Gmail tokens in settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    const connected = !!(settings?.gmailAccessToken);
    
    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Error checking Gmail connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
} 