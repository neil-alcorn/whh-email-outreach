import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMailConfig,
  maskSecret,
  requireConfigForImap,
  requireConfigForSmtp,
} from '../src/config.js';

test('buildMailConfig applies Cybernautic defaults and parses secure flags', () => {
  const config = buildMailConfig({
    WHH_EMAIL_ADDRESS: 'neil@welcomehomehaiti.com',
    WHH_EMAIL_DISPLAY_NAME: 'Neil at WHH',
    WHH_EMAIL_PASSWORD: 'super-secret',
  });

  assert.equal(config.email.address, 'neil@welcomehomehaiti.com');
  assert.equal(config.email.displayName, 'Neil at WHH');
  assert.equal(config.email.password, 'super-secret');
  assert.deepEqual(config.imap, {
    host: 'secure.emailsrvr.com',
    port: 993,
    secure: true,
  });
  assert.deepEqual(config.smtp, {
    host: 'secure.emailsrvr.com',
    port: 465,
    secure: true,
  });
  assert.equal(config.safety.dailySendLimit, 15);
  assert.equal(config.safety.requireApprovalBeforeSend, true);
  assert.deepEqual(config.summaries, {
    recipientEmail: '',
  });
});

test('buildMailConfig reads the summary recipient email', () => {
  const config = buildMailConfig({
    WHH_EMAIL_ADDRESS: 'neil@welcomehomehaiti.com',
    WHH_EMAIL_PASSWORD: 'super-secret',
    SUMMARY_RECIPIENT_EMAIL: 'nalcorn22@gmail.com',
  });

  assert.equal(config.summaries.recipientEmail, 'nalcorn22@gmail.com');
});

test('requireConfigForSmtp reports missing fields without exposing secrets', () => {
  const config = buildMailConfig({
    WHH_EMAIL_ADDRESS: 'neil@welcomehomehaiti.com',
    WHH_EMAIL_PASSWORD: '',
  });

  assert.throws(
    () => requireConfigForSmtp(config),
    /Missing required SMTP configuration: WHH_EMAIL_PASSWORD/,
  );
});

test('requireConfigForImap reports missing fields without exposing secrets', () => {
  const config = buildMailConfig({
    WHH_EMAIL_ADDRESS: '',
    WHH_EMAIL_PASSWORD: 'super-secret',
  });

  assert.throws(
    () => requireConfigForImap(config),
    /Missing required IMAP configuration: WHH_EMAIL_ADDRESS/,
  );
});

test('maskSecret keeps only a safe hint', () => {
  assert.equal(maskSecret(''), '(empty)');
  assert.equal(maskSecret('abc'), '***');
  assert.equal(maskSecret('super-secret'), 'su***et');
});
