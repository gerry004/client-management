import { NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Gmail client
    const gmail = await getGmailClient(user.id);
    if (!gmail) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 });
    }

    // Generate tracking ID
    const trackingId = uuidv4();
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/${trackingId}" width="1" height="1" />`;
    
    // Create test email content
    const subject = "Test Email Tracking";
    const content = `
      <h1>Email Tracking Test</h1>
      <p>This is a test email to verify that tracking is working correctly.</p>
      <p>The time is: ${new Date().toISOString()}</p>
      ${trackingPixel}
    `;

    // Create email message
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${user.email}`,
      `Subject: ${subject}`,
      '',
      content
    ].join('\r\n');

    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(message).toString('base64url')
      }
    });

    // Log the email
    await prisma.emailLog.create({
      data: {
        recipientEmail: user.email,
        subject,
        content,
        status: 'SENT',
        type: 'TEST',
        trackingId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test email sent with tracking",
      trackingId
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 