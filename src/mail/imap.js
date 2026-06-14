import { ImapFlow } from 'imapflow';

import { requireConfigForImap } from '../config.js';

export function buildImapClientOptions(config) {
  requireConfigForImap(config);

  return {
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: {
      user: config.email.address,
      pass: config.email.password,
    },
    logger: false,
  };
}

export function buildImapClient(config) {
  return new ImapFlow(buildImapClientOptions(config));
}

export async function fetchRecentMessageSummaries({ config, limit = 5, client = buildImapClient(config) }) {
  requireConfigForImap(config);
  const max = Math.max(1, Math.min(Number.parseInt(String(limit), 10) || 5, 25));

  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true });
      const total = status.messages || 0;
      if (total === 0) return [];

      const start = Math.max(1, total - max + 1);
      const summaries = [];

      for await (const message of client.fetch(`${start}:*`, {
        envelope: true,
        uid: true,
        flags: true,
        internalDate: true,
      })) {
        summaries.push({
          uid: message.uid,
          date: message.envelope?.date || message.internalDate || null,
          from: (message.envelope?.from || []).map((addr) => addr.address).filter(Boolean).join(', '),
          subject: message.envelope?.subject || '',
          flags: Array.from(message.flags || []),
        });
      }

      return summaries.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
