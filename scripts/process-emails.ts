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
  
  // Get all emails that have been sent to this lead
  const sentEmails = await prisma.emailTracking.findMany({
    where: { leadId },
    orderBy: { sentAt: 'desc' }
  });
  
  // If no emails have been sent, return the first sequence
  if (sentEmails.length === 0) {
    return { nextSequence: sequences[0], canSendNow: true };
  }
  
  // Create a map of sequence IDs that have been sent
  const sentSequenceIds = new Set(sentEmails.map(email => email.sequenceId));
  
  // Find the first sequence that hasn't been sent yet
  for (const sequence of sequences) {
    if (!sentSequenceIds.has(sequence.id)) {
      // This is the next sequence to send
      
      // If this is the first sequence, we can send it
      if (sequence.orderIndex === 0) {
        return { nextSequence: sequence, canSendNow: true };
      }
      
      // Find the previous sequence
      const previousSequence = sequences.find(s => s.orderIndex === sequence.orderIndex - 1);
      
      if (!previousSequence) {
        return { nextSequence: sequence, canSendNow: true };
      }
      
      // Find the most recent sending of the previous sequence
      const previousSequenceEmail = sentEmails.find(email => email.sequenceId === previousSequence.id);
      
      if (!previousSequenceEmail) {
        // Previous sequence hasn't been sent, which shouldn't happen
        return { nextSequence: null, canSendNow: false };
      }
      
      // Check if enough time has passed since the previous sequence
      const delayInMs = sequence.delayDays * 24 * 60 * 60 * 1000;
      const nextSendDate = new Date(previousSequenceEmail.sentAt.getTime() + delayInMs);
      
      return { 
        nextSequence: sequence, 
        canSendNow: new Date() >= nextSendDate 
      };
    }
  }
  
  // If all sequences have been sent, return null
  return { nextSequence: null, canSendNow: false };
}

processEmails(); 