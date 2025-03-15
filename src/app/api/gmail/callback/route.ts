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
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    
    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=${encodeURIComponent('Missing parameters')}`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=${encodeURIComponent('Invalid state')}`
      );
    }
    
    const { userId, token } = stateObj;
    
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
      
      // Redirect with the token from state
      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_success=true`
      );
      if (token) {
        response.cookies.set('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' // Changed from 'strict' to help with redirect
        });
      }
      return response;
    } catch (error) {
      console.error('Error in Gmail token exchange:', error);
      
      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=${encodeURIComponent('Failed to authenticate with Gmail')}`
      );
      // Preserve the auth token
      if (token) {
        response.cookies.set('token', token);
      }
      return response;
    }
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=${encodeURIComponent('Authentication failed')}`
    );
    // Preserve the auth token
    if (token) {
      response.cookies.set('token', token);
    }
    return response;
  }
} 