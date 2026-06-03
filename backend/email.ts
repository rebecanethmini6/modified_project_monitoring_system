import fs from 'fs';
import path from 'path';

export type EmailOptions = {
  to: string;
  subject: string;
  body: string;
};

export async function sendMockEmail({ to, subject, body }: EmailOptions): Promise<void> {
  const date = new Date().toISOString();
  
  // Format the email output for console logging
  const border = '='.repeat(60);
  const consoleOutput = `
${border}
✉️  MOCK EMAIL SENT AT ${date}
${border}
To:      ${to}
Subject: ${subject}
Message:
${body}
${border}
`;

  // Print to server console
  console.log(consoleOutput);

  // Append to local log file in project root
  const logFilePath = path.join(process.cwd(), 'sent_emails.log');
  const fileOutput = `
============================================================
Date:    ${date}
To:      ${to}
Subject: ${subject}
Message:
${body}
============================================================
`;

  try {
    await fs.promises.appendFile(logFilePath, fileOutput, 'utf8');
  } catch (error) {
    console.error('Failed to write mock email to log file:', error);
  }
}
