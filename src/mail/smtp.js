import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

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

export function buildRawTextEmail(message) {
  const from = requiredMessageField(message, 'from');
  const to = requiredMessageField(message, 'to');
  const subject = requiredMessageField(message, 'subject');
  const text = String(message.text || '');
  const date = message.date ? new Date(message.date) : new Date();
  const messageId = message.messageId || `<${crypto.randomUUID()}@welcomehomehaiti.com>`;

  return [
    `Message-ID: ${messageId}`,
    `Date: ${date.toUTCString()}`,
    `From: ${foldHeader(from)}`,
    `To: ${foldHeader(to)}`,
    optionalHeader('Bcc', message.bcc),
    `Subject: ${foldHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizeBody(text),
  ].filter((line) => line !== null).join('\r\n');
}

function formatFrom(displayName, address) {
  const cleanName = String(displayName || address).replaceAll('"', '\\"');
  return `"${cleanName}" <${address}>`;
}

function requiredMessageField(message, field) {
  const value = String(message?.[field] || '').trim();
  if (!value) throw new Error(`Email message ${field} is required`);
  return value;
}

function foldHeader(value) {
  return String(value).replace(/[\r\n]+/g, ' ').trim();
}

function optionalHeader(name, value) {
  const cleanValue = foldHeader(value || '');
  return cleanValue ? `${name}: ${cleanValue}` : null;
}

function normalizeBody(value) {
  return String(value).replace(/\r?\n/g, '\r\n');
}
