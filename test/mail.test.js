import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMailConfig } from '../src/config.js';
import { appendSentMessage, buildImapClientOptions } from '../src/mail/imap.js';
import { buildRawTextEmail, buildTestEmailMessage, sendTestEmail } from '../src/mail/smtp.js';

function validConfig() {
  return buildMailConfig({
    WHH_EMAIL_ADDRESS: 'neil@welcomehomehaiti.com',
    WHH_EMAIL_DISPLAY_NAME: 'Neil at WHH',
    WHH_EMAIL_PASSWORD: 'super-secret',
  });
}

test('buildTestEmailMessage creates a plain human-readable test email', () => {
  const message = buildTestEmailMessage(validConfig(), 'nalcorn22@gmail.com');

  assert.equal(message.from, '"Neil at WHH" <neil@welcomehomehaiti.com>');
  assert.equal(message.to, 'nalcorn22@gmail.com');
  assert.match(message.subject, /WHH Email Outreach Test/);
  assert.match(message.text, /test email/i);
  assert.match(message.text, /Welcome Home Haiti/i);
});

test('sendTestEmail sends through the provided transport', async () => {
  const sent = [];
  const transport = {
    async sendMail(message) {
      sent.push(message);
      return { messageId: 'test-message-id' };
    },
  };

  const result = await sendTestEmail({
    config: validConfig(),
    to: 'nalcorn22@gmail.com',
    transport,
  });

  assert.equal(result.messageId, 'test-message-id');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'nalcorn22@gmail.com');
});

test('sendTestEmail requires a recipient', async () => {
  await assert.rejects(
    () => sendTestEmail({ config: validConfig(), to: '', transport: { sendMail() {} } }),
    /Test email recipient is required/,
  );
});

test('buildRawTextEmail creates appendable RFC822 text content', () => {
  const raw = buildRawTextEmail({
    from: '"Neil at WHH" <neil@welcomehomehaiti.com>',
    to: 'nalcorn22@gmail.com',
    bcc: 'summary@example.com',
    subject: 'A quick WHH update',
    text: 'Hello\nWorld',
    date: '2026-06-19T12:00:00Z',
    messageId: '<test-id@welcomehomehaiti.com>',
  });

  assert.match(raw, /^Message-ID: <test-id@welcomehomehaiti\.com>\r\n/);
  assert.match(raw, /\r\nBcc: summary@example.com\r\n/);
  assert.match(raw, /\r\nSubject: A quick WHH update\r\n/);
  assert.match(raw, /\r\nContent-Type: text\/plain; charset=utf-8\r\n/);
  assert.match(raw, /\r\n\r\nHello\r\nWorld$/);
});

test('buildImapClientOptions maps config into imapflow options', () => {
  const options = buildImapClientOptions(validConfig());

  assert.equal(options.host, 'secure.emailsrvr.com');
  assert.equal(options.port, 993);
  assert.equal(options.secure, true);
  assert.deepEqual(options.auth, {
    user: 'neil@welcomehomehaiti.com',
    pass: 'super-secret',
  });
  assert.equal(options.logger, false);
});

test('appendSentMessage appends raw sent content to sent folder', async () => {
  const calls = [];
  const client = {
    async connect() {
      calls.push(['connect']);
    },
    async append(folder, rawMessage, flags, internalDate) {
      calls.push(['append', folder, rawMessage, flags, internalDate]);
      return { path: folder, uid: 123 };
    },
    async logout() {
      calls.push(['logout']);
    },
  };

  const date = new Date('2026-06-19T12:00:00Z');
  const result = await appendSentMessage({
    config: validConfig(),
    rawMessage: 'Subject: test\r\n\r\nbody',
    client,
    internalDate: date,
  });

  assert.deepEqual(result, { path: 'INBOX.Sent', uid: 123 });
  assert.deepEqual(calls, [
    ['connect'],
    ['append', 'INBOX.Sent', 'Subject: test\r\n\r\nbody', ['\\Seen'], date],
    ['logout'],
  ]);
});
