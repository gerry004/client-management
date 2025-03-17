import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.lead.count();
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting leads:', error);
    return NextResponse.json({ error: 'Failed to count leads' }, { status: 500 });
  }
} 