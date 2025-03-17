import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { leads } = await req.json();
    
    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Process in batches of 100 for efficiency
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      // Prepare data for insertion
      const data = batch.map(lead => {
        // Ensure required fields are present
        if (!lead.name) {
          return null;
        }
        
        return {
          name: lead.name,
          company: lead.company || null,
          email: lead.email || null,
          phone: lead.phone || null,
          segmentId: lead.segmentId ? parseInt(lead.segmentId, 10) : null,
        };
      }).filter(Boolean);
      
      // Insert valid leads
      if (data.length > 0) {
        const result = await prisma.lead.createMany({
          data: data as any[],
          skipDuplicates: false,
        });
        
        successCount += result.count;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${successCount} leads` 
    });
    
  } catch (error) {
    console.error('Error importing leads:', error);
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 });
  }
} 