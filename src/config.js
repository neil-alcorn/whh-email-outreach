import dotenv from 'dotenv';

const DEFAULTS = {
  IMAP_HOST: 'secure.emailsrvr.com',
  IMAP_PORT: '993',
  IMAP_SECURE: 'true',
  SMTP_HOST: 'secure.emailsrvr.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  DAILY_SEND_LIMIT: '15',
  REQUIRE_APPROVAL_BEFORE_SEND: 'true',
  SUMMARY_RECIPIENT_EMAIL: '',
};

export function loadEnv(path = '.env') {
  dotenv.config({ path, quiet: true });
  return process.env;
}

export function buildMailConfig(env = process.env) {
  const merged = { ...DEFAULTS, ...env };

  return {
    email: {
      address: stringValue(merged.WHH_EMAIL_ADDRESS),
      displayName: stringValue(merged.WHH_EMAIL_DISPLAY_NAME || merged.WHH_EMAIL_ADDRESS),
      password: stringValue(merged.WHH_EMAIL_PASSWORD),
    },
    imap: {
      host: stringValue(merged.IMAP_HOST),
      port: numberValue(merged.IMAP_PORT),
      secure: booleanValue(merged.IMAP_SECURE),
    },
    smtp: {
      host: stringValue(merged.SMTP_HOST),
      port: numberValue(merged.SMTP_PORT),
      secure: booleanValue(merged.SMTP_SECURE),
    },
    safety: {
      dailySendLimit: numberValue(merged.DAILY_SEND_LIMIT),
      requireApprovalBeforeSend: booleanValue(merged.REQUIRE_APPROVAL_BEFORE_SEND),
    },
    summaries: {
      recipientEmail: stringValue(merged.SUMMARY_RECIPIENT_EMAIL),
    },
  };
}

export function requireConfigForSmtp(config) {
  requireFields(config, [
    ['WHH_EMAIL_ADDRESS', config.email.address],
    ['WHH_EMAIL_PASSWORD', config.email.password],
    ['SMTP_HOST', config.smtp.host],
    ['SMTP_PORT', config.smtp.port],
  ], 'SMTP');
}

export function requireConfigForImap(config) {
  requireFields(config, [
    ['WHH_EMAIL_ADDRESS', config.email.address],
    ['WHH_EMAIL_PASSWORD', config.email.password],
    ['IMAP_HOST', config.imap.host],
    ['IMAP_PORT', config.imap.port],
  ], 'IMAP');
}

export function safeConfigSummary(config) {
  return {
    email: {
      address: config.email.address,
      displayName: config.email.displayName,
      password: maskSecret(config.email.password),
    },
    imap: config.imap,
    smtp: config.smtp,
    safety: config.safety,
    summaries: config.summaries,
  };
}

export function maskSecret(value) {
  const secret = stringValue(value);
  if (!secret) return '(empty)';
  if (secret.length <= 4) return '***';
  return `${secret.slice(0, 2)}***${secret.slice(-2)}`;
}

function requireFields(config, fields, label) {
  const missing = fields
    .filter(([, value]) => value === '' || value === null || value === undefined || Number.isNaN(value))
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing required ${label} configuration: ${missing.join(', ')}`);
  }

  return config;
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function numberValue(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function booleanValue(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value).trim().toLowerCase());
}
