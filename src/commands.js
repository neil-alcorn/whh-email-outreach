import { buildMailConfig, loadEnv, safeConfigSummary } from './config.js';
import { fetchRecentMessageSummaries as defaultFetchRecentMessageSummaries } from './mail/imap.js';
import { sendTestEmail as defaultSendTestEmail } from './mail/smtp.js';

export async function runCommand(argv, deps = {}) {
  const args = [...argv];
  const command = args.shift();
  const env = deps.env || loadEnv();
  const config = buildMailConfig(env);
  const sendTestEmail = deps.sendTestEmail || defaultSendTestEmail;
  const fetchRecentMessageSummaries = deps.fetchRecentMessageSummaries || defaultFetchRecentMessageSummaries;

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
    '',
    'Examples:',
    '  npm run cli -- check-config',
    '  npm run cli -- send-test -- --to nalcorn22@gmail.com',
    '  npm run cli -- recent-inbox -- --limit 5',
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
