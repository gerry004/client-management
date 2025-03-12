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

    // Update campaign basic info
    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        segmentId: data.segmentId,
      },
    });

    // Get existing sequences
    const existingSequences = await prisma.emailSequence.findMany({
      where: { campaignId },
      orderBy: { orderIndex: 'asc' },
    });

    // Update existing sequences and create new ones as needed
    for (let i = 0; i < data.sequences.length; i++) {
      const newSeq = data.sequences[i];
      
      if (i < existingSequences.length) {
        // Update existing sequence
        await prisma.emailSequence.update({
          where: { id: existingSequences[i].id },
          data: {
            subject: newSeq.subject,
            content: newSeq.content,
            delayDays: newSeq.delayDays,
            orderIndex: newSeq.orderIndex,
          },
        });
      } else {
        // Create new sequence
        await prisma.emailSequence.create({
          data: {
            campaignId,
            subject: newSeq.subject,
            content: newSeq.content,
            delayDays: newSeq.delayDays,
            orderIndex: newSeq.orderIndex,
          },
        });
      }
    }

    // Delete any extra sequences if the new list is shorter
    if (existingSequences.length > data.sequences.length) {
      const keepIds = existingSequences
        .slice(0, data.sequences.length)
        .map(seq => seq.id);
      
      await prisma.emailSequence.deleteMany({
        where: {
          campaignId,
          id: { notIn: keepIds },
        },
      });
    }

    // Fetch the updated campaign with all its relations
    const finalCampaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        segment: true,
        sequences: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json(finalCampaign);
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