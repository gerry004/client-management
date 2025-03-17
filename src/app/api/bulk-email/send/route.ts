import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGmailClient } from '@/lib/gmail';
import { getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { segmentId, subject, content } = await request.json();

    // Get Gmail client
    const gmail = await getGmailClient(user.id);

    // Get all leads in the segment
    const leads = await prisma.lead.findMany({
      where: {
        segmentId: parseInt(segmentId)
      },
      select: {
        email: true,
        name: true,
      }
    });

    // Queue emails for sending
    const emailPromises = leads.map(async (lead) => {
      if (!lead.email) return; // Skip leads without email addresses

      // Generate a tracking ID
      const trackingId = uuidv4();
      
      // Generate a random value for cache busting
      const randomValue = Math.random().toString(36).substring(2, 15);
      
      // Add tracking pixel to the content with cache-busting parameter
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/${trackingId}?r=${randomValue}" width="1" height="1" alt="" style="display:none" />`;

      // Personalize content for each lead
      const personalizedContent = content
        .replace(/\{{name\}}/g, lead.name || '')
        .replace(/\{{email\}}/g, lead.email);
        
      const trackedContent = personalizedContent + trackingPixel;

      try {
        // Create email message
        const message = [
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `To: ${lead.email}`,
          `Subject: ${subject}`,
          '',
          trackedContent
        ].join('\r\n');

        // Send email using Gmail API directly
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: Buffer.from(message).toString('base64url')
          }
        });

        // Log the email in your database
        await prisma.emailLog.create({
          data: {
            recipientEmail: lead.email,
            subject,
            content: trackedContent,
            status: 'SENT',
            type: 'BULK',
            trackingId,
          },
        });
      } catch (error) {
        console.error(`Failed to send email to ${lead.email}:`, error);
        
        // Log failed attempts
        await prisma.emailLog.create({
          data: {
            recipientEmail: lead.email,
            subject,
            content: personalizedContent,
            status: 'FAILED',
            type: 'BULK',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

    // Send all emails
    await Promise.all(emailPromises.filter(Boolean));

    return NextResponse.json({ 
      success: true, 
      count: leads.filter(lead => lead.email).length 
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk emails' },
      { status: 500 }
    );
  }
}