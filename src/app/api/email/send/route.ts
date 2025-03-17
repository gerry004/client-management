import { NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail';
import { getUserFromRequest } from '@/lib/auth'; // Use your existing auth method
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Get the user using your existing auth method
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { to, subject, content } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient(user.id);
    if (!gmail) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 401 }
      );
    }

    // Generate a tracking ID
    const trackingId = uuidv4();
    
    // Add tracking pixel to the content
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/${trackingId}" width="1" height="1" />`;
    const trackedContent = content + trackingPixel;

    // Create the email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: me`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      trackedContent,
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Log the email in your database
    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        subject,
        content: trackedContent,
        status: 'SENT',
        type: 'SINGLE',
        trackingId,
      },
    });

    return NextResponse.json({ 
      success: true,
      messageId: response.data.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed attempts
    try {
      await prisma.emailLog.create({
        data: {
          recipientEmail: (await request.json()).to || 'unknown',
          subject: (await request.json()).subject || 'unknown',
          content: (await request.json()).content || '',
          status: 'FAILED',
          type: 'SINGLE',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 