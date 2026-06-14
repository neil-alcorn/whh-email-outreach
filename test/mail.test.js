import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMailConfig } from '../src/config.js';
import { buildImapClientOptions } from '../src/mail/imap.js';
import { buildTestEmailMessage, sendTestEmail } from '../src/mail/smtp.js';

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
