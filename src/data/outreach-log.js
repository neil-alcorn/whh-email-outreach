import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_OUTREACH_LOG_PATH = 'data/ignored/email-outreach-log.json';
export const DEFAULT_BOARD_METRICS_PATH = 'data/ignored/board-email-metrics.json';
export const DEFAULT_CAMPAIGN = 'spring-2026';
export const SPRING_CAMPAIGN_LINK = 'https://welcomehomehaiti.com/2026-spring-campaign';

const SURVEY_LINKS = {
  LYBUNT: 'https://whh-donor-feedback.netlify.app/?segment=LYBUNT&source=email',
  LYBNT: 'https://whh-donor-feedback.netlify.app/?segment=LYBUNT&source=email',
  SYBUNT: 'https://whh-donor-feedback.netlify.app/?segment=SYBUNT&source=email',
  SYBNT: 'https://whh-donor-feedback.netlify.app/?segment=SYBUNT&source=email',
};

export async function readOutreachLog(logPath = DEFAULT_OUTREACH_LOG_PATH) {
  try {
    const raw = await readFile(logPath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeLog(parsed);
  } catch (error) {
    if (error.code === 'ENOENT') return emptyLog();
    throw error;
  }
}

export async function writeOutreachLog(logPath, log) {
  const normalized = normalizeLog(log);
  normalized.metadata.updated_at = new Date().toISOString();
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(logPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

export async function queueOutreachEmail({
  logPath = DEFAULT_OUTREACH_LOG_PATH,
  recipientEmail,
  recipientName = '',
  donorId = '',
  segment = '',
  templateKey,
  subject,
  campaign = DEFAULT_CAMPAIGN,
  surveyLink,
  springCampaignLink = SPRING_CAMPAIGN_LINK,
  bodyFile = '',
  notes = '',
  test = false,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}) {
  if (!recipientEmail) throw new Error('recipientEmail is required');
  if (!templateKey) throw new Error('templateKey is required');
  if (!subject) throw new Error('subject is required');

  const log = await readOutreachLog(logPath);
  const timestamp = now().toISOString();
  const record = {
    send_id: createId(),
    created_at: timestamp,
    queued_at: timestamp,
    sent_at: null,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    donor_id: donorId,
    segment: segment.toUpperCase(),
    template_key: templateKey,
    subject,
    message_id: null,
    campaign,
    survey_link: surveyLink || surveyLinkForSegment(segment),
    spring_campaign_link: springCampaignLink,
    body_file: bodyFile,
    status: 'queued',
    reply_received_at: null,
    notes,
    test: Boolean(test),
  };

  log.records.push(record);
  await writeOutreachLog(logPath, log);
  return record;
}

export async function updateOutreachRecord({ logPath = DEFAULT_OUTREACH_LOG_PATH, sendId, changes }) {
  if (!sendId) throw new Error('sendId is required');
  if (!changes || typeof changes !== 'object') throw new Error('changes are required');

  const log = await readOutreachLog(logPath);
  const index = log.records.findIndex((record) => record.send_id === sendId);
  if (index === -1) throw new Error(`No outreach record found for send id: ${sendId}`);

  log.records[index] = { ...log.records[index], ...changes };
  await writeOutreachLog(logPath, log);
  return log.records[index];
}

export async function summarizeOutreachLog(logPath = DEFAULT_OUTREACH_LOG_PATH) {
  const log = await readOutreachLog(logPath);
  const summary = {
    total: log.records.length,
    tests: 0,
    by_status: {},
    by_segment: {},
    by_template: {},
    by_campaign: {},
  };

  for (const record of log.records) {
    if (record.test) summary.tests += 1;
    increment(summary.by_status, record.status || 'unknown');
    increment(summary.by_segment, record.segment || 'unknown');
    increment(summary.by_template, record.template_key || 'unknown');
    increment(summary.by_campaign, record.campaign || 'unknown');
  }

  return summary;
}

export async function exportBoardMetrics({
  logPath = DEFAULT_OUTREACH_LOG_PATH,
  outPath = DEFAULT_BOARD_METRICS_PATH,
  surveyResponses = 0,
  campaign = DEFAULT_CAMPAIGN,
  generatedAt = () => new Date(),
}) {
  const log = await readOutreachLog(logPath);
  const records = log.records.filter((record) => !record.test && record.campaign === campaign);
  const sent = records.filter((record) => record.sent_at || ['sent', 'replied'].includes(record.status)).length;
  const replies = records.filter((record) => record.reply_received_at || record.status === 'replied').length;
  const metrics = {
    generated_at: generatedAt().toISOString(),
    campaign,
    sent,
    replies,
    reply_rate: sent ? Number((replies / sent).toFixed(4)) : 0,
    survey_responses: Number(surveyResponses) || 0,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  return metrics;
}

function emptyLog() {
  return {
    metadata: {
      schema_version: 1,
      updated_at: null,
    },
    records: [],
  };
}

function normalizeLog(log) {
  return {
    metadata: {
      schema_version: log?.metadata?.schema_version || 1,
      updated_at: log?.metadata?.updated_at || null,
    },
    records: Array.isArray(log?.records) ? log.records : [],
  };
}

function surveyLinkForSegment(segment) {
  return SURVEY_LINKS[String(segment || '').toUpperCase()] || '';
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1;
}
