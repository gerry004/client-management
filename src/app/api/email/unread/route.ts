import { NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emails } = await request.json();
    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Use the centralized Gmail client that handles token refresh
    const gmail = await getGmailClient(user.id);
    
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