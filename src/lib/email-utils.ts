import { Lead } from '@prisma/client';

export function createEmailContent(template: string, lead: Lead): string {
  return template.replace(/{{(\w+)}}/g, (match, field) => {
    return lead[field as keyof Lead]?.toString() || '';
  });
}

export function parseEmail(emailContent: string): {
  subject: string;
  body: string;
} {
  // Add email parsing logic here
  return {
    subject: '',
    body: ''
  };
} 