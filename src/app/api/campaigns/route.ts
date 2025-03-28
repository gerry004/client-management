import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const campaigns = await prisma.emailCampaign.findMany({
      include: {
        segment: true,
        sequences: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: body.name,
        segmentId: body.segmentId,
        sequences: {
          create: body.sequences.map((seq: any) => ({
            subject: seq.subject,
            content: seq.content,
            delayDays: seq.delayDays,
            orderIndex: seq.orderIndex,
          })),
        },
      },
      include: {
        segment: true,
        sequences: true,
      },
    });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
} 