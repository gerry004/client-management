import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (!userSettings?.gmailAccessToken) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: userSettings.gmailAccessToken,
      refresh_token: userSettings.gmailRefreshToken,
      expiry_date: userSettings.gmailTokenExpiry?.getTime()
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const leadEmail = decodeURIComponent(params.email);

    // Search for emails to/from the lead's email address
    const query = `from:${leadEmail} OR to:${leadEmail}`;
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    });

    const threads = response.data.threads || [];
    const emailThreads = await Promise.all(
      threads.map(async (thread) => {
        const threadDetails = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id!,
        });

        const messages = threadDetails.data.messages?.map((message) => {
          const headers = message.payload?.headers || [];
          return {
            id: message.id,
            from: headers.find((h) => h.name === 'From')?.value || '',
            to: headers.find((h) => h.name === 'To')?.value || '',
            subject: headers.find((h) => h.name === 'Subject')?.value || '',
            date: headers.find((h) => h.name === 'Date')?.value || '',
            body: message.snippet || '',
          };
        });

        return {
          id: thread.id,
          subject: messages?.[0]?.subject || 'No Subject',
          snippet: threadDetails.data.snippet || '',
          lastMessageDate: messages?.[messages.length - 1]?.date || '',
          messages: messages || [],
        };
      })
    );

    return NextResponse.json(emailThreads);
  } catch (error) {
    console.error('Error fetching email history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email history' },
      { status: 500 }
    );
  }
} 