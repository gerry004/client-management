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
    
    // Get all existing segments for lookup
    const existingSegments = await prisma.segment.findMany();
    const segmentNameToId = new Map(existingSegments.map(s => [s.name.toLowerCase(), s.id]));
    
    // Track new segments to create
    const newSegmentNames = new Set();
    
    // First pass: identify new segments
    leads.forEach(lead => {
      if (lead.segment && typeof lead.segment === 'string' && lead.segment.trim()) {
        const segmentName = lead.segment.trim();
        const segmentNameLower = segmentName.toLowerCase();
        
        if (!segmentNameToId.has(segmentNameLower)) {
          newSegmentNames.add(segmentName);
        }
      }
    });
    
    // Create new segments
    if (newSegmentNames.size > 0) {
      const newSegments = await prisma.segment.createMany({
        data: Array.from(newSegmentNames).map(name => ({ name: name as string })),
        skipDuplicates: true,
      });
      
      // Refresh segment lookup after creating new ones
      const allSegments = await prisma.segment.findMany();
      segmentNameToId.clear();
      allSegments.forEach(s => segmentNameToId.set(s.name.toLowerCase(), s.id));
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
        
        // Look up segment ID by name if provided
        let segmentId = null;
        if (lead.segment && typeof lead.segment === 'string' && lead.segment.trim()) {
          const segmentNameLower = lead.segment.trim().toLowerCase();
          segmentId = segmentNameToId.get(segmentNameLower) || null;
        }
        
        return {
          name: lead.name,
          website: lead.website || null,
          mapsLink: lead.mapsLink || null,
          email: lead.email || null,
          phone: lead.phone || null,
          searchTerm: lead.searchTerm || null,
          segmentId: segmentId,
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