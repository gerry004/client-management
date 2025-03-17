import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '15', 10);
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Calculate pagination
    const skip = (page - 1) * perPage;

    const leads = await prisma.lead.findMany({
      include: {
        segment: true
      },
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: perPage
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const lead = await prisma.lead.create({
      data
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
