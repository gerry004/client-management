import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (!userSettings?.gmailAccessToken) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    const { emails } = await request.json();
    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userSettings.gmailAccessToken,
      refresh_token: userSettings.gmailRefreshToken,
      expiry_date: userSettings.gmailTokenExpiry?.getTime()
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const unreadCounts = await Promise.all(
      emails.map(async (email) => {
        if (!email) return { email, count: 0 };
        
        try {
          const query = `from:${email} is:unread`;
          const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
          });

          return {
            email,
            count: response.data.resultSizeEstimate || 0
          };
        } catch (error) {
          console.error(`Error fetching unread count for ${email}:`, error);
          return { email, count: 0 };
        }
      })
    );

    return NextResponse.json(
      Object.fromEntries(unreadCounts.map(({ email, count }) => [email, count]))
    );
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
} 