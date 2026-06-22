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

test('queue-email records a donor email without sending or printing recipient details', async () => {
  const queued = [];
  const result = await runCommand([
    'queue-email',
    '--to',
    'donor@example.com',
    '--name',
    'Example Donor',
    '--segment',
    'LYBUNT',
    '--template',
    'lybunt-reconnect-v1',
    '--subject',
    'A quick WHH update',
  ], {
    env,
    queueOutreachEmail: async (record) => {
      queued.push(record);
      return { send_id: 'send-123', status: 'queued' };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.equal(queued[0].recipientEmail, 'donor@example.com');
  assert.equal(queued[0].recipientName, 'Example Donor');
  assert.equal(queued[0].segment, 'LYBUNT');
  assert.match(result.output, /Queued 1 email/);
  assert.match(result.output, /send-123/);
  assert.doesNotMatch(result.output, /donor@example.com/);
  assert.doesNotMatch(result.output, /Example Donor/);
});

test('outreach-summary prints counts only', async () => {
  const result = await runCommand(['outreach-summary', '--log', 'data/ignored/test-log.json'], {
    env,
    summarizeOutreachLog: async (logPath) => {
      assert.equal(logPath, 'data/ignored/test-log.json');
      return {
        total: 2,
        tests: 1,
        by_status: { queued: 1, sent: 1 },
        by_segment: { LYBUNT: 1, SYBUNT: 1 },
        by_template: { 'lybunt-reconnect-v1': 1, 'sybunt-reconnect-v1': 1 },
        by_campaign: { 'spring-2026': 2 },
      };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /Total: 2/);
  assert.match(result.output, /Tests: 1/);
  assert.match(result.output, /queued: 1/);
});

test('export-board-metrics writes the dashboard metric file', async () => {
  const result = await runCommand([
    'export-board-metrics',
    '--log',
    'data/ignored/test-log.json',
    '--out',
    'data/ignored/board-email-metrics.json',
    '--survey-responses',
    '9',
  ], {
    env,
    exportBoardMetrics: async (options) => {
      assert.equal(options.logPath, 'data/ignored/test-log.json');
      assert.equal(options.outPath, 'data/ignored/board-email-metrics.json');
      assert.equal(options.surveyResponses, 9);
      return {
        generated_at: '2026-06-19T21:00:00.000Z',
        campaign: 'spring-2026',
        sent: 12,
        replies: 3,
        reply_rate: 0.25,
        survey_responses: 9,
      };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /sent: 12/);
  assert.match(result.output, /replies: 3/);
  assert.match(result.output, /reply_rate: 0.25/);
  assert.match(result.output, /survey_responses: 9/);
});

test('mark-email updates a tracked email status without exposing recipient details', async () => {
  const result = await runCommand([
    'mark-email',
    '--id',
    'send-123',
    '--status',
    'sent',
    '--message-id',
    '<provider-message-id>',
  ], {
    env,
    updateOutreachRecord: async (options) => {
      assert.equal(options.sendId, 'send-123');
      assert.equal(options.changes.status, 'sent');
      assert.equal(options.changes.message_id, '<provider-message-id>');
      assert.match(options.changes.sent_at, /^\d{4}-\d{2}-\d{2}T/);
      return { send_id: 'send-123', status: 'sent' };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /Updated send-123/);
  assert.match(result.output, /Status: sent/);
});
