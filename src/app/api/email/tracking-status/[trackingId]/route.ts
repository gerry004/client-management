import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { trackingId: string } }
) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackingId } = params;
    
    if (!trackingId) {
      return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 });
    }

    // Find the email log with this tracking ID
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId },
    });

    if (!emailLog) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({
      trackingId,
      recipientEmail: emailLog.recipientEmail,
      subject: emailLog.subject,
      opened: emailLog.opened,
      openCount: emailLog.openCount,
      openedAt: emailLog.openedAt,
      sentAt: emailLog.createdAt
    });
  } catch (error) {
    console.error('Error checking tracking status:', error);
    return NextResponse.json(
      { error: 'Failed to check tracking status' },
      { status: 500 }
    );
  }
} 