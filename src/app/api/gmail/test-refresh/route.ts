import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getGmailClient } from '@/lib/gmail';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force token to be expired
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: {
        gmailTokenExpiry: new Date(Date.now() - 3600 * 1000) // 1 hour ago
      }
    });

    // This should trigger a refresh
    const gmail = await getGmailClient(user.id);
    
    // Make a simple API call to verify it works
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });

    // Get the updated token info
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: {
        gmailTokenExpiry: true
      }
    });

    return NextResponse.json({
      message: 'Token refresh test completed',
      emailAddress: profile.data.emailAddress,
      newExpiryTime: settings?.gmailTokenExpiry
    });
  } catch (error) {
    console.error('Error testing token refresh:', error);
    return NextResponse.json(
      { error: 'Token refresh test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 