import { buildMailConfig, loadEnv, safeConfigSummary } from './config.js';
import {
  buildOutreachDatabase,
  readWorkbookSheets as defaultReadWorkbookSheets,
  writeJsonFile as defaultWriteJsonFile,
} from './data/importer.js';
import {
  DEFAULT_BOARD_METRICS_PATH,
  DEFAULT_OUTREACH_LOG_PATH,
  exportBoardMetrics as defaultExportBoardMetrics,
  queueOutreachEmail as defaultQueueOutreachEmail,
  summarizeOutreachLog as defaultSummarizeOutreachLog,
  updateOutreachRecord as defaultUpdateOutreachRecord,
} from './data/outreach-log.js';
import { fetchRecentMessageSummaries as defaultFetchRecentMessageSummaries } from './mail/imap.js';
import { sendTestEmail as defaultSendTestEmail } from './mail/smtp.js';

export async function runCommand(argv, deps = {}) {
  const args = [...argv];
  const command = args.shift();
  const env = deps.env || loadEnv();
  const config = buildMailConfig(env);
  const sendTestEmail = deps.sendTestEmail || defaultSendTestEmail;
  const fetchRecentMessageSummaries = deps.fetchRecentMessageSummaries || defaultFetchRecentMessageSummaries;
  const readWorkbookSheets = deps.readWorkbookSheets || defaultReadWorkbookSheets;
  const writeJsonFile = deps.writeJsonFile || defaultWriteJsonFile;
  const queueOutreachEmail = deps.queueOutreachEmail || defaultQueueOutreachEmail;
  const summarizeOutreachLog = deps.summarizeOutreachLog || defaultSummarizeOutreachLog;
  const exportBoardMetrics = deps.exportBoardMetrics || defaultExportBoardMetrics;
  const updateOutreachRecord = deps.updateOutreachRecord || defaultUpdateOutreachRecord;

  try {
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      return ok(helpText());
    }

    if (command === 'check-config') {
      return ok(`${JSON.stringify(safeConfigSummary(config), null, 2)}\n`);
    }

    if (command === 'send-test') {
      const to = optionValue(args, '--to');
      if (!to) {
        return fail('Usage: npm run cli -- send-test -- --to your-address@gmail.com');
      }

      const result = await sendTestEmail({ config, to });
      return ok(`Sent test email to ${to}\nMessage ID: ${result.messageId || '(provider did not return one)'}\n`);
    }

    if (command === 'recent-inbox') {
      const limit = optionValue(args, '--limit') || '5';
      const summaries = await fetchRecentMessageSummaries({ config, limit });
      if (!summaries.length) return ok('No recent inbox messages found.\n');
      return ok(`${summaries.map(formatSummary).join('\n')}\n`);
    }

    if (command === 'import-workbook') {
      const input = optionValue(args, '--input');
      const outputPath = optionValue(args, '--out') || 'data/ignored/outreach-contacts.json';
      const pythonCommand = optionValue(args, '--python') || env.WORKBOOK_IMPORT_PYTHON;
      if (!input) {
        return fail('Usage: npm run cli -- import-workbook -- --input path/to/source.xlsx [--out data/ignored/outreach-contacts.json] [--python path/to/python]');
      }

      const sheets = await readWorkbookSheets(input, { pythonCommand });
      const database = buildOutreachDatabase({ sourceFile: input, sheets });
      await writeJsonFile(outputPath, database);
      return ok([
        `Imported ${database.metadata.totalContacts} contacts to ${outputPath}.`,
        `Skipped ${database.metadata.skippedDuplicates} duplicate email records.`,
        '',
      ].join('\n'));
    }

    if (command === 'queue-email') {
      const recipientEmail = optionValue(args, '--to');
      const templateKey = optionValue(args, '--template');
      const subject = optionValue(args, '--subject');
      if (!recipientEmail || !templateKey || !subject) {
        return fail('Usage: npm run cli -- queue-email -- --to donor@example.com --template lybunt-reconnect-v1 --subject "A quick WHH update" [--name "Donor Name"] [--segment LYBUNT]');
      }

      const record = await queueOutreachEmail({
        logPath: optionValue(args, '--log') || DEFAULT_OUTREACH_LOG_PATH,
        recipientEmail,
        recipientName: optionValue(args, '--name'),
        donorId: optionValue(args, '--donor-id'),
        segment: optionValue(args, '--segment'),
        templateKey,
        subject,
        campaign: optionValue(args, '--campaign') || undefined,
        surveyLink: optionValue(args, '--survey-link'),
        springCampaignLink: optionValue(args, '--spring-campaign-link') || undefined,
        bodyFile: optionValue(args, '--body-file'),
        notes: optionValue(args, '--notes'),
        test: hasFlag(args, '--test'),
      });
      return ok(`Queued 1 email.\nSend ID: ${record.send_id}\nStatus: ${record.status}\n`);
    }

    if (command === 'outreach-summary') {
      const summary = await summarizeOutreachLog(optionValue(args, '--log') || DEFAULT_OUTREACH_LOG_PATH);
      return ok(formatOutreachSummary(summary));
    }

    if (command === 'mark-email') {
      const sendId = optionValue(args, '--id');
      const status = optionValue(args, '--status');
      if (!sendId || !status) {
        return fail('Usage: npm run cli -- mark-email -- --id <send-id> --status sent|replied|failed [--message-id <id>] [--notes "..."]');
      }

      const now = new Date().toISOString();
      const changes = {
        status,
        message_id: optionValue(args, '--message-id') || undefined,
        notes: optionValue(args, '--notes') || undefined,
      };
      if (status === 'sent' || status === 'replied') changes.sent_at = optionValue(args, '--sent-at') || now;
      if (status === 'replied') changes.reply_received_at = optionValue(args, '--reply-at') || now;

      const record = await updateOutreachRecord({
        logPath: optionValue(args, '--log') || DEFAULT_OUTREACH_LOG_PATH,
        sendId,
        changes: removeUndefined(changes),
      });
      return ok(`Updated ${record.send_id}.\nStatus: ${record.status}\n`);
    }

    if (command === 'export-board-metrics') {
      const outPath = optionValue(args, '--out') || DEFAULT_BOARD_METRICS_PATH;
      const metrics = await exportBoardMetrics({
        logPath: optionValue(args, '--log') || DEFAULT_OUTREACH_LOG_PATH,
        outPath,
        surveyResponses: Number(optionValue(args, '--survey-responses') || 0),
        campaign: optionValue(args, '--campaign') || undefined,
      });
      return ok([
        `Exported board email metrics to ${outPath}.`,
        `sent: ${metrics.sent}`,
        `replies: ${metrics.replies}`,
        `reply_rate: ${metrics.reply_rate}`,
        `survey_responses: ${metrics.survey_responses}`,
        '',
      ].join('\n'));
    }

    return fail(`Unknown command: ${command}\n\n${helpText()}`);
  } catch (error) {
    return fail(error.message || String(error));
  }
}

export function helpText() {
  return [
    'WHH Email Outreach CLI',
    '',
    'Commands:',
    '  check-config                    Show masked local email configuration',
    '  send-test --to <email>          Send one SMTP test email',
    '  recent-inbox [--limit <count>]  Show recent inbox metadata only',
    '  import-workbook --input <xlsx>  Import outreach contacts into local ignored JSON',
    '  queue-email --to <email>        Queue one tracked outreach email without sending',
    '  outreach-summary                Show tracked outreach counts only',
    '  mark-email --id <id>            Mark one queued email sent/replied/failed',
    '  export-board-metrics            Export sent/reply/survey metrics for board reporting',
    '',
    'Examples:',
    '  npm run cli -- check-config',
    '  npm run cli -- send-test -- --to nalcorn22@gmail.com',
    '  npm run cli -- recent-inbox -- --limit 5',
    '  npm run cli -- import-workbook -- --input C:\\path\\to\\WHH_Podcast_Outreach_Tracking.xlsx',
    '  npm run cli -- queue-email -- --to donor@example.com --segment LYBUNT --template lybunt-reconnect-v1 --subject "A quick WHH update"',
    '  npm run cli -- outreach-summary',
    '  npm run cli -- mark-email -- --id <send-id> --status sent --message-id <provider-message-id>',
    '  npm run cli -- export-board-metrics -- --survey-responses 0',
    '',
  ].join('\n');
}

function ok(output) {
  return { exitCode: 0, output, error: '' };
}

function fail(error) {
  return { exitCode: 1, output: '', error: `${error}\n` };
}

function optionValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
}

function hasFlag(args, name) {
  return args.includes(name);
}

function formatSummary(message) {
  const date = message.date ? new Date(message.date).toISOString() : '(no date)';
  return [
    `UID: ${message.uid}`,
    `Date: ${date}`,
    `From: ${message.from || '(unknown)'}`,
    `Subject: ${message.subject || '(no subject)'}`,
    `Flags: ${(message.flags || []).join(', ') || '(none)'}`,
  ].join(' | ');
}

function formatOutreachSummary(summary) {
  return [
    `Total: ${summary.total}`,
    `Tests: ${summary.tests}`,
    'By status:',
    formatCounts(summary.by_status),
    'By segment:',
    formatCounts(summary.by_segment),
    'By template:',
    formatCounts(summary.by_template),
    'By campaign:',
    formatCounts(summary.by_campaign),
    '',
  ].join('\n');
}

function formatCounts(counts) {
  const entries = Object.entries(counts || {});
  if (!entries.length) return '  (none)';
  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}
