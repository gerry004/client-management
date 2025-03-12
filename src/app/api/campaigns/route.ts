import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const campaigns = await prisma.emailCampaign.findMany({
      include: {
        segment: true,
        sequences: true,
      }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: data.name,
        segmentId: data.segmentId,
        sequences: {
          create: data.sequences
        }
      },
      include: {
        segment: true,
        sequences: true
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
} 