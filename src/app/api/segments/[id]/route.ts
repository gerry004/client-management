import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid segment ID' },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // First, find any campaigns using this segment
    const campaignsWithSegment = await prisma.emailCampaign.findMany({
      where: { segmentId: id },
    });
    
    // Update those campaigns to have null segmentId
    if (campaignsWithSegment.length > 0) {
      await prisma.emailCampaign.updateMany({
        where: { segmentId: id },
        data: { segmentId: null },
      });
    }
    
    // Now delete the segment
    await prisma.segment.delete({
      where: { id },
    });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete segment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 