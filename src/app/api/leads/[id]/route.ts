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

    const data = await request.json();
    
    // Only include the fields that can be updated
    const updateData = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      segmentId: data.segmentId,
    };

    const lead = await prisma.lead.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: { segment: true }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.lead.delete({
      where: { id: parseInt(params.id) }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
} 