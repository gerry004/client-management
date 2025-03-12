import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = parseInt(params.id);
    const data = await request.json();

    // First, delete related email tracking records
    await prisma.emailTracking.deleteMany({
      where: {
        sequence: {
          campaignId: campaignId
        }
      }
    });

    // Then delete existing sequences
    await prisma.emailSequence.deleteMany({
      where: { campaignId },
    });

    // Update campaign and create new sequences
    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        segmentId: data.segmentId,
        sequences: {
          create: data.sequences.map((seq: any) => ({
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

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = parseInt(params.id);

    // First, delete related email tracking records
    await prisma.emailTracking.deleteMany({
      where: {
        sequence: {
          campaignId: campaignId
        }
      }
    });

    // Then delete associated sequences
    await prisma.emailSequence.deleteMany({
      where: { campaignId },
    });

    // Finally delete the campaign
    await prisma.emailCampaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
} 