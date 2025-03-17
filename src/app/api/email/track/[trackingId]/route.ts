import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { trackingId: string } }
) {
  try {
    console.log('TRACKING PIXEL LOADED');
    const { trackingId } = params;
    
    if (!trackingId) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Find the email log with this tracking ID
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId },
    });

    if (!emailLog) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Update the email log to mark it as opened
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        opened: true,
        openCount: emailLog.openCount + 1,
        openedAt: emailLog.openedAt || new Date(), // Only set first open time
      },
    });

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    // Generate a random value for cache busting
    const randomValue = Math.random().toString(36).substring(2, 15);

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${randomValue}"`,
        'Vary': '*',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 