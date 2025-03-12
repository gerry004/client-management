import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { parseEmail, createEmailContent } from '../src/lib/email-utils.js';

const prisma = new PrismaClient();

async function checkSendingCriteria(leadId: number, sequenceId: number): Promise<boolean> {
  const lastEmail = await prisma.emailTracking.findFirst({
    where: { leadId, sequenceId },
    orderBy: { sentAt: 'desc' }
  });

  if (!lastEmail) return true; // No email sent yet, ok to send

  const sequence = await prisma.emailSequence.findUnique({
    where: { id: sequenceId }
  });

  if (!sequence) return false;

  const delayInMs = sequence.delayDays * 24 * 60 * 60 * 1000;
  const nextSendDate = new Date(lastEmail.sentAt.getTime() + delayInMs);

  return new Date() >= nextSendDate;
}

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
        for (const sequence of campaign.sequences) {
          // Check if email should be sent based on delay
          const shouldSend = await checkSendingCriteria(lead.id, sequence.id);
          
          if (shouldSend && lead.email) {
            const emailContent = createEmailContent(sequence.content, lead);
            
            await transporter.sendMail({
              from: process.env.EMAIL_FROM,
              to: lead.email,
              subject: sequence.subject,
              html: emailContent,
            });

            // Record the email sending
            await prisma.emailTracking.create({
              data: {
                leadId: lead.id,
                sequenceId: sequence.id,
                sentAt: new Date(),
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processEmails(); 