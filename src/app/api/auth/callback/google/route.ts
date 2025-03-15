import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  console.log('Google callback received');
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    
    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/leads?gmail_error=${encodeURIComponent('Missing code or state parameter')}`
      );
    }
    
    // Decode state parameter
    let stateObj;
    try {
      const decodedState = Buffer.from(stateParam, 'base64').toString();
      stateObj = JSON.parse(decodedState);
    } catch (e) {
      console.error('Failed to decode state parameter:', e);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/leads?gmail_error=${encodeURIComponent('Invalid state parameter')}`
      );
    }
    
    const { userId } = stateObj;
    
    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      // Store tokens in database
      await prisma.userSettings.upsert({
        where: { userId: parseInt(userId) },
        update: {
          gmailAccessToken: tokens.access_token || '',
          gmailRefreshToken: tokens.refresh_token || '',
          gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        },
        create: {
          userId: parseInt(userId),
          gmailAccessToken: tokens.access_token || '',
          gmailRefreshToken: tokens.refresh_token || '',
          gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        }
      });
      
      // Redirect back to leads page with success
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/leads?gmail_success=true`
      );
    } catch (error) {
      console.error('Error in Gmail token exchange:', error);
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/leads?gmail_error=${encodeURIComponent('Failed to authenticate with Gmail')}`
      );
    }
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/leads?gmail_error=${encodeURIComponent('Authentication failed')}`
    );
  }
} 