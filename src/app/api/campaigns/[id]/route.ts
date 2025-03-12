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

    // When deleting sequences, we need to handle the email tracking records first
    if (existingSequences.length > data.sequences.length) {
      const keepIds = existingSequences
        .slice(0, data.sequences.length)
        .map(seq => seq.id);
      
      const sequencesToDelete = existingSequences
        .filter(seq => !keepIds.includes(seq.id))
        .map(seq => seq.id);
      
      // First delete the email tracking records for these sequences
      if (sequencesToDelete.length > 0) {
        await prisma.emailTracking.deleteMany({
          where: {
            sequenceId: {
              in: sequencesToDelete
            }
          }
        });
        
        // Then delete the sequences
        await prisma.emailSequence.deleteMany({
          where: {
            campaignId,
            id: { in: sequencesToDelete },
          },
        });
      }
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

    // Get all sequences for this campaign
    const sequences = await prisma.emailSequence.findMany({
      where: { campaignId }
    });

    // Delete email tracking records for all sequences in this campaign
    if (sequences.length > 0) {
      await prisma.emailTracking.deleteMany({
        where: {
          sequenceId: {
            in: sequences.map(seq => seq.id)
          }
        }
      });
    }

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