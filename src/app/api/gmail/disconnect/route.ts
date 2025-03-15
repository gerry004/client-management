import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST() {
  try {
    const user = await getUserFromRequest();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (settings?.gmailAccessToken) {
      // Revoke access token if it exists
      oauth2Client.setCredentials({
        access_token: settings.gmailAccessToken
      });
      
      try {
        await oauth2Client.revokeToken(settings.gmailAccessToken);
      } catch (revokeError) {
        console.error('Error revoking token:', revokeError);
        // Continue with update even if revocation fails
      }

      // Update settings to remove Gmail tokens
      await prisma.userSettings.update({
        where: { userId: user.id },
        data: {
          gmailAccessToken: null,
          gmailRefreshToken: null,
          gmailTokenExpiry: null
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
} 