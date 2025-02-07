import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tagId = parseInt(params.id);
    if (isNaN(tagId)) {
      return new NextResponse('Invalid tag ID', { status: 400 });
    }

    // First update all leads that use this tag to remove the tag
    await prisma.lead.updateMany({
      where: { tagId },
      data: { tagId: null }
    });

    // Then delete the tag
    await prisma.tag.delete({
      where: { id: tagId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 