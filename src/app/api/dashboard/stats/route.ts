import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total leads count
    const totalLeads = await prisma.lead.count();
    
    // Get email statistics
    const totalEmails = await prisma.emailLog.count();
    
    // Get opened emails count
    const openedEmails = await prisma.emailLog.count({
      where: {
        opened: true
      }
    });
    
    // Calculate open rate
    const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        totalEmails,
        openedEmails,
        openRate: parseFloat(openRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 