import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { parseEmail, createEmailContent } from '../src/lib/email-utils.js';

const prisma = new PrismaClient();

async function processEmails() {
  console.log("Processing emails")
  try {
    // Get all active campaigns and their sequences
    const campaigns = await prisma.emailCampaign.findMany({
      include: {
        segment: {
          include: {
            leads: true
          }
        },
        sequences: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      }
    });

    for (const campaign of campaigns) {
      for (const lead of campaign.segment.leads) {
        // Find the next sequence that should be sent for this lead
        const { nextSequence, canSendNow } = await findNextSequenceToSend(lead.id, campaign.sequences);
        
        if (nextSequence && lead.email && canSendNow) {
          const emailContent = createEmailContent(nextSequence.content, lead);
          
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: lead.email,
            subject: nextSequence.subject,
            html: emailContent,
          });

          // Record the email sending
          await prisma.emailTracking.create({
            data: {
              leadId: lead.id,
              sequenceId: nextSequence.id,
              sentAt: new Date(),
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Updated helper function to find the next sequence and check if it can be sent now
async function findNextSequenceToSend(leadId: number, sequences: any[]): Promise<{ nextSequence: any | null, canSendNow: boolean }> {
  if (!sequences.length) return { nextSequence: null, canSendNow: false };
  
  const campaignId = sequences[0].campaignId;
  console.log("campaignId", campaignId);
  
  // Get all tracking records for this lead
  const sentEmails = await prisma.emailTracking.findMany({
    where: { leadId },
    orderBy: { sentAt: 'desc' },
    include: { sequence: true }
  });
  
  console.log("sentEmails", sentEmails);
  
  // Find the highest order index that has been sent for this campaign
  // We'll look at the order indices of sequences in the current campaign configuration
  let highestSentOrderIndex = -1;
  
  // First, try to find emails with valid sequence references
  const validEmails = sentEmails.filter(email => 
    email.sequence && email.sequence.campaignId === campaignId
  );
  
  if (validEmails.length > 0) {
    // We have valid emails with sequence references
    const orderIndices = validEmails.map(email => email.sequence.orderIndex);
    highestSentOrderIndex = Math.max(...orderIndices);
  } else {
    // If we don't have valid sequence references, check if we have any emails
    // that were sent for this campaign before the sequences were recreated
    
    // Get all campaigns to check for name matches
    const allCampaigns = await prisma.emailCampaign.findMany();
    const thisCampaign = allCampaigns.find(c => c.id === campaignId);
    
    if (thisCampaign) {
      // Count how many distinct emails have been sent to this lead for this campaign
      // This is a fallback approach when sequence references are broken
      const emailCount = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT et.sequence_id) 
        FROM email_tracking et
        JOIN email_sequences es ON et.sequence_id = es.id
        WHERE et.lead_id = ${leadId}
        AND es.campaign_id = ${campaignId}
      `;
      
      // If we have sent emails, set the highest order index to the count - 1
      // This assumes sequences are sent in order
      if (Array.isArray(emailCount) && emailCount[0] && typeof emailCount[0].count === 'number') {
        highestSentOrderIndex = emailCount[0].count - 1;
      }
    }
  }
  
  console.log("highestSentOrderIndex", highestSentOrderIndex);
  
  // Sort sequences by orderIndex
  const sortedSequences = [...sequences].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Find the next sequence to send
  const nextSequence = sortedSequences.find(seq => seq.orderIndex > highestSentOrderIndex);
  
  if (!nextSequence) {
    // All sequences have been sent
    return { nextSequence: null, canSendNow: false };
  }
  
  // For delay calculation, find the most recent email sent
  const mostRecentEmail = sentEmails[0]; // Already ordered by sentAt desc
  
  if (!mostRecentEmail) {
    // No previous emails, can send immediately
    return { nextSequence, canSendNow: true };
  }
  
  // Check if enough time has passed
  const delayInMs = nextSequence.delayDays * 24 * 60 * 60 * 1000;
  const nextSendDate = new Date(mostRecentEmail.sentAt.getTime() + delayInMs);
  
  return { 
    nextSequence, 
    canSendNow: new Date() >= nextSendDate 
  };
}

processEmails(); 