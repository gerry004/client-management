import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
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
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: body.name,
        segmentId: body.segmentId,
        sequences: {
          create: body.sequences.map((seq: any, index: number) => ({
            ...seq,
            orderIndex: index,
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
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
} 