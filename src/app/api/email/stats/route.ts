import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const email = url.searchParams.get('email');
    
    // Build the query
    const whereClause: any = {};
    
    if (type) {
      whereClause.type = type.toUpperCase();
    }
    
    if (email) {
      whereClause.recipientEmail = email;
    }

    // Get email stats
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    // Get open rates
    const openStats = await prisma.emailLog.aggregate({
      where: {
        ...whereClause,
        status: 'SENT'
      },
      _count: {
        id: true
      },
      _sum: {
        openCount: true
      }
    });

    // Format the response
    const formattedStats = {
      total: stats.reduce((acc, curr) => acc + curr._count.id, 0),
      sent: stats.find(s => s.status === 'SENT')?._count.id || 0,
      failed: stats.find(s => s.status === 'FAILED')?._count.id || 0,
      opened: await prisma.emailLog.count({
        where: {
          ...whereClause,
          opened: true
        }
      }),
      openRate: openStats._count.id > 0 
        ? (await prisma.emailLog.count({
            where: {
              ...whereClause,
              opened: true
            }
          }) / openStats._count.id) * 100 
        : 0,
      totalOpens: openStats._sum.openCount || 0
    };

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
} 