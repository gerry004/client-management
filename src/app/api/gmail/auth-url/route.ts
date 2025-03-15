import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getUserFromRequest } from '@/lib/auth';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    // Get the referer or current path to return to after auth
    const referer = request.headers.get('referer') || '/dashboard';
    const returnPath = new URL(referer).pathname;
    
    // Create state parameter with user ID, return path, and token
    const stateObj = {
      userId: user.id.toString(),
      returnPath: '/settings',
      token: token // Add token to state
    };
    const stateParam = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    // Generate the URL for Gmail authorization
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      prompt: 'consent',
      state: stateParam // Pass encoded state object
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
} 