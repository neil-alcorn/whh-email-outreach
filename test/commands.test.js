import assert from 'node:assert/strict';
import test from 'node:test';

import { runCommand } from '../src/commands.js';

const env = {
  WHH_EMAIL_ADDRESS: 'neil@welcomehomehaiti.com',
  WHH_EMAIL_DISPLAY_NAME: 'Neil at WHH',
  WHH_EMAIL_PASSWORD: 'super-secret',
};

test('check-config returns a masked config summary', async () => {
  const result = await runCommand(['check-config'], { env });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /neil@welcomehomehaiti.com/);
  assert.match(result.output, /su\*\*\*et/);
  assert.doesNotMatch(result.output, /super-secret/);
});

test('send-test requires an explicit recipient', async () => {
  const result = await runCommand(['send-test'], { env });

  assert.equal(result.exitCode, 1);
  assert.match(result.error, /Usage: npm run cli -- send-test -- --to/);
});

test('send-test sends through injected sender', async () => {
  const sent = [];
  const result = await runCommand(['send-test', '--to', 'nalcorn22@gmail.com'], {
    env,
    sendTestEmail: async ({ to }) => {
      sent.push(to);
      return { messageId: 'abc123' };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.equal(sent[0], 'nalcorn22@gmail.com');
  assert.match(result.output, /abc123/);
});

test('recent-inbox prints message metadata without body content', async () => {
  const result = await runCommand(['recent-inbox', '--limit', '1'], {
    env,
    fetchRecentMessageSummaries: async () => [
      {
        uid: 12,
        date: new Date('2026-06-13T20:00:00Z'),
        from: 'host@example.com',
        subject: 'Podcast reply',
        flags: ['\\Seen'],
      },
    ],
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /Podcast reply/);
  assert.match(result.output, /host@example.com/);
});
