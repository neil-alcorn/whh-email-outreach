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

test('import-workbook writes a local database summary without printing contacts', async () => {
  const writes = [];
  const reads = [];
  const result = await runCommand([
    'import-workbook',
    '--input',
    'source.xlsx',
    '--out',
    'data/ignored/outreach-contacts.json',
    '--python',
    'python-with-openpyxl',
  ], {
    env,
    readWorkbookSheets: async (input, options) => {
      reads.push({ input, options });
      return [
        {
          name: 'Sheet1',
          rows: [
            { sourceRow: 2, values: { Email: 'private@example.com', 'Podcast/Platform Name': 'Private Show' } },
          ],
        },
      ];
    },
    writeJsonFile: async (path, data) => writes.push({ path, data }),
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(reads[0], {
    input: 'source.xlsx',
    options: { pythonCommand: 'python-with-openpyxl' },
  });
  assert.equal(writes[0].path, 'data/ignored/outreach-contacts.json');
  assert.equal(writes[0].data.metadata.totalContacts, 1);
  assert.match(result.output, /Imported 1 contacts/);
  assert.doesNotMatch(result.output, /private@example.com/);
  assert.doesNotMatch(result.output, /Private Show/);
});
