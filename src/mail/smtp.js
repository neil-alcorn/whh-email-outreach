import nodemailer from 'nodemailer';

import { requireConfigForSmtp } from '../config.js';

export function buildSmtpTransport(config) {
  requireConfigForSmtp(config);

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.email.address,
      pass: config.email.password,
    },
  });
}

export function buildTestEmailMessage(config, to) {
  const recipient = String(to || '').trim();
  if (!recipient) {
    throw new Error('Test email recipient is required');
  }

  return {
    from: formatFrom(config.email.displayName, config.email.address),
    to: recipient,
    subject: `WHH Email Outreach Test - ${new Date().toISOString().slice(0, 10)}`,
    text: [
      'This is a test email from the local WHH email outreach connector.',
      '',
      'If you received this, SMTP sending is working for Welcome Home Haiti outreach.',
      '',
      'No outreach batch has been sent. This was only a connector test.',
    ].join('\n'),
  };
}

export async function sendTestEmail({ config, to, transport = buildSmtpTransport(config) }) {
  requireConfigForSmtp(config);
  const message = buildTestEmailMessage(config, to);
  return transport.sendMail(message);
}

function formatFrom(displayName, address) {
  const cleanName = String(displayName || address).replaceAll('"', '\\"');
  return `"${cleanName}" <${address}>`;
}
