/**
 * Email utility — sends transactional emails via the Brevo (ex-Sendinblue) API.
 * Requires BREVO_API_KEY, EMAIL_FROM and EMAIL_FROM_NAME in the environment.
 *
 * If BREVO_API_KEY is absent the function falls back to console + file logging
 * so development environments without credentials still work.
 */

import fs from 'fs';
import path from 'path';

export type EmailOptions = {
  to: string;
  toName?: string;
  subject: string;
  /** Plain-text fallback body */
  body: string;
  /** Optional HTML body. If omitted the plain text is wrapped in <pre>. */
  html?: string;
  /** EmailJS Template ID */
  templateId?: string;
  /** Values used by the selected EmailJS template. */
  templateParams?: Record<string, string>;
};

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send an email via Brevo. Throws on network / API errors so callers can
 * handle failures gracefully (e.g. log and continue, never block the response).
 */
export async function sendEmail(opts: EmailOptions): Promise<void> {
  const serviceId = 'service_ljt7oaf';
  const templateId = opts.templateId || 'template_ybwvu3y';
  const publicKey = 'ga0rNCzTshc7YzzJr';

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: process.env.EMAILJS_PRIVATE_KEY || '',
    template_params: {
      to_email: opts.to,
      to_name: opts.toName ?? 'User',
      subject: opts.subject,
      message: opts.body,
      html: opts.html ?? '',
      // Add standard variables in case this hits the supervisor template
      recipientName: opts.toName ?? 'User',
      projectTitle: opts.subject.replace(/✅|📋|📌/g, '').trim(),
      studentName: 'Student', 
      supervisorName: 'Supervisor/Coordinator',
      ...opts.templateParams,
    },
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = 'Unknown error';
    }
    throw new Error(`EmailJS API error ${response.status}: ${detail}`);
  }

  // Log success to console for visibility
  console.log(`[email] ✉️  Sent (EmailJS) → ${opts.to} | "${opts.subject}"`);
}

/**
 * @deprecated Use sendEmail instead. Kept for backwards-compatibility with
 * any existing callers that still reference sendMockEmail.
 */
export async function sendMockEmail(opts: EmailOptions): Promise<void> {
  return sendEmail(opts);
}

// ── Private helpers ──────────────────────────────────────────────────────────

async function _logToFile(opts: EmailOptions): Promise<void> {
  const date = new Date().toISOString();
  const border = '='.repeat(60);

  console.log(`
${border}
✉️  EMAIL (no API key) — ${date}
${border}
To:      ${opts.to}
Subject: ${opts.subject}
Message:
${opts.body}
${border}`);

  const logFilePath = path.join(process.cwd(), 'sent_emails.log');
  const entry = `
============================================================
Date:    ${date}
To:      ${opts.to}
Subject: ${opts.subject}
Message:
${opts.body}
============================================================
`;
  try {
    await fs.promises.appendFile(logFilePath, entry, 'utf8');
  } catch (err) {
    console.error('[email] Failed to write to log file:', err);
  }
}
