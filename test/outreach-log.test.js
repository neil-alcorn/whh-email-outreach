import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  exportBoardMetrics,
  queueOutreachEmail,
  readOutreachLog,
  summarizeOutreachLog,
  updateOutreachRecord,
} from '../src/data/outreach-log.js';

test('queueOutreachEmail creates a queued record with campaign links', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'whh-outreach-log-'));
  const logPath = path.join(dir, 'email-outreach-log.json');

  try {
    const record = await queueOutreachEmail({
      logPath,
      recipientEmail: 'donor@example.com',
      recipientName: 'Example Donor',
      segment: 'LYBUNT',
      templateKey: 'lybunt-reconnect-v1',
      subject: 'A quick WHH update',
      now: () => new Date('2026-06-19T18:00:00Z'),
      createId: () => 'send-123',
    });

    assert.equal(record.send_id, 'send-123');
    assert.equal(record.status, 'queued');
    assert.equal(record.campaign, 'spring-2026');
    assert.equal(record.survey_link, 'https://whh-donor-feedback.netlify.app/?segment=LYBUNT&source=email');
    assert.equal(record.spring_campaign_link, 'https://welcomehomehaiti.com/2026-spring-campaign');

    const log = await readOutreachLog(logPath);
    assert.equal(log.records.length, 1);
    assert.equal(log.records[0].recipient_email, 'donor@example.com');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('summarizeOutreachLog counts by status and segment without exposing recipients', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'whh-outreach-log-'));
  const logPath = path.join(dir, 'email-outreach-log.json');

  try {
    await queueOutreachEmail({
      logPath,
      recipientEmail: 'one@example.com',
      segment: 'LYBUNT',
      templateKey: 'lybunt-reconnect-v1',
      subject: 'A quick WHH update',
      createId: () => 'send-1',
    });
    await queueOutreachEmail({
      logPath,
      recipientEmail: 'two@example.com',
      segment: 'SYBUNT',
      templateKey: 'sybunt-reconnect-v1',
      subject: 'A quick WHH update',
      createId: () => 'send-2',
      test: true,
    });
    await updateOutreachRecord({
      logPath,
      sendId: 'send-1',
      changes: { status: 'sent', sent_at: '2026-06-19T19:00:00.000Z' },
    });

    const summary = await summarizeOutreachLog(logPath);

    assert.equal(summary.total, 2);
    assert.deepEqual(summary.by_status, { sent: 1, queued: 1 });
    assert.deepEqual(summary.by_segment, { LYBUNT: 1, SYBUNT: 1 });
    assert.equal(summary.tests, 1);
    assert.equal(JSON.stringify(summary).includes('one@example.com'), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('exportBoardMetrics excludes tests and calculates reply rate', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'whh-outreach-log-'));
  const logPath = path.join(dir, 'email-outreach-log.json');
  const outPath = path.join(dir, 'board-email-metrics.json');

  try {
    await queueOutreachEmail({
      logPath,
      recipientEmail: 'sent@example.com',
      segment: 'LYBUNT',
      templateKey: 'lybunt-reconnect-v1',
      subject: 'A quick WHH update',
      createId: () => 'send-1',
    });
    await queueOutreachEmail({
      logPath,
      recipientEmail: 'reply@example.com',
      segment: 'SYBUNT',
      templateKey: 'sybunt-reconnect-v1',
      subject: 'A quick WHH update',
      createId: () => 'send-2',
    });
    await queueOutreachEmail({
      logPath,
      recipientEmail: 'test@example.com',
      segment: 'LYBUNT',
      templateKey: 'lybunt-reconnect-v1',
      subject: 'A quick WHH update',
      createId: () => 'send-3',
      test: true,
    });
    await updateOutreachRecord({
      logPath,
      sendId: 'send-1',
      changes: { status: 'sent', sent_at: '2026-06-19T19:00:00.000Z' },
    });
    await updateOutreachRecord({
      logPath,
      sendId: 'send-2',
      changes: {
        status: 'replied',
        sent_at: '2026-06-19T19:05:00.000Z',
        reply_received_at: '2026-06-19T20:00:00.000Z',
      },
    });
    await updateOutreachRecord({
      logPath,
      sendId: 'send-3',
      changes: { status: 'sent', sent_at: '2026-06-19T19:10:00.000Z' },
    });

    const metrics = await exportBoardMetrics({
      logPath,
      outPath,
      surveyResponses: 7,
      generatedAt: () => new Date('2026-06-19T21:00:00Z'),
    });

    assert.deepEqual(metrics, {
      generated_at: '2026-06-19T21:00:00.000Z',
      campaign: 'spring-2026',
      sent: 2,
      replies: 1,
      reply_rate: 0.5,
      survey_responses: 7,
    });

    const written = JSON.parse(await readFile(outPath, 'utf8'));
    assert.equal(written.reply_rate, 0.5);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
