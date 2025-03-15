import { google } from 'googleapis';
import { prisma } from './prisma';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
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

  // Set credentials
  oauth2Client.setCredentials({
    access_token: settings.gmailAccessToken,
    refresh_token: settings.gmailRefreshToken || undefined,
    expiry_date: settings.gmailTokenExpiry?.getTime() || undefined
  });

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