import { google } from 'googleapis';
import { prisma } from './prisma';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function getGmailClient(userId: number) {
  // Get user's settings
  const settings = await prisma.userSettings.findUnique({
    where: { userId }
  });

  if (!settings?.gmailAccessToken) {
    throw new Error('Gmail not connected');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const isExpired = settings.gmailTokenExpiry && 
    new Date(settings.gmailTokenExpiry).getTime() - 5 * 60 * 1000 < Date.now();

  if (isExpired && settings.gmailRefreshToken) {    
    try {
      // Set credentials with refresh token
      oauth2Client.setCredentials({
        refresh_token: settings.gmailRefreshToken
      });
      
      // Force token refresh
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update database with new tokens
      await prisma.userSettings.update({
        where: { userId },
        data: {
          gmailAccessToken: credentials.access_token,
          gmailRefreshToken: credentials.refresh_token || settings.gmailRefreshToken,
          gmailTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
        }
      });
      
      // Set the refreshed credentials
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || settings.gmailRefreshToken,
        expiry_date: credentials.expiry_date
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Continue with existing token, the request might still work
      oauth2Client.setCredentials({
        access_token: settings.gmailAccessToken,
        refresh_token: settings.gmailRefreshToken,
        expiry_date: settings.gmailTokenExpiry?.getTime()
      });
    }
  } else {
    // Set credentials with existing token
    oauth2Client.setCredentials({
      access_token: settings.gmailAccessToken,
      refresh_token: settings.gmailRefreshToken || undefined,
      expiry_date: settings.gmailTokenExpiry?.getTime() || undefined
    });
  }

  // Handle token refresh if needed
  oauth2Client.on('tokens', async (tokens) => {
    const updateData: any = {};
    
    if (tokens.access_token) {
      updateData.gmailAccessToken = tokens.access_token;
    }
    
    if (tokens.refresh_token) {
      updateData.gmailRefreshToken = tokens.refresh_token;
    }
    
    if (tokens.expiry_date) {
      updateData.gmailTokenExpiry = new Date(tokens.expiry_date);
    }
    
    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.userSettings.update({
        where: { userId },
        data: updateData
      });
    }
  });

  // Create and return Gmail client
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface EmailParams {
  to: string;
  subject: string;
  content: string;
}

export async function sendEmail({ to, subject, content }: EmailParams) {
  const response = await fetch('/api/gmail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      subject,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
}
