import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOutreachDatabase,
  normalizeContactRow,
} from '../src/data/importer.js';

test('normalizeContactRow maps tracker sheet fields into a contact record', () => {
  const contact = normalizeContactRow({
    row: {
      'First Name': ' Jane ',
      'Last Name': ' Host ',
      Email: ' JANE@EXAMPLE.COM ',
      'Podcast/Platform Name': 'Hope Stories',
      Category: 'Podcast',
      Website: ' https://example.com ',
      'Lead Status': 'Ready',
      'Initial Contact Date': new Date('2026-06-01T00:00:00Z'),
      Notes: 'Strong Haiti-adjacent audience',
    },
    sourceSheet: 'Sheet1',
    sourceRow: 2,
    sourceFile: 'WHH_Podcast_Outreach_Tracking.xlsx',
  });

  assert.deepEqual(contact, {
    id: 'sheet1-2-jane-example-com',
    source: {
      file: 'WHH_Podcast_Outreach_Tracking.xlsx',
      sheet: 'Sheet1',
      row: 2,
    },
    contactName: 'Jane Host',
    email: 'jane@example.com',
    platformName: 'Hope Stories',
    category: 'Podcast',
    website: 'https://example.com',
    description: '',
    leadStatus: 'Ready',
    initialContactDate: '2026-06-01',
    followUpDate: '',
    responseStatus: '',
    notes: 'Strong Haiti-adjacent audience',
    reviewStatus: 'needs_review',
  });
});

test('buildOutreachDatabase keeps contact emails local and dedupes by email', () => {
  const database = buildOutreachDatabase({
    sourceFile: 'source.xlsx',
    importedAt: '2026-06-14T12:00:00.000Z',
    sheets: [
      {
        name: 'Sheet1',
        rows: [
          { sourceRow: 2, values: { Email: 'person@example.com', 'Podcast/Platform Name': 'First' } },
          { sourceRow: 3, values: { Email: 'PERSON@example.com', 'Podcast/Platform Name': 'Duplicate' } },
          { sourceRow: 4, values: { Email: '', Website: 'https://no-email.example', 'Podcast/Platform Name': 'No Email' } },
        ],
      },
    ],
  });

  assert.equal(database.metadata.sourceFile, 'source.xlsx');
  assert.equal(database.metadata.importedAt, '2026-06-14T12:00:00.000Z');
  assert.equal(database.metadata.totalContacts, 2);
  assert.equal(database.metadata.skippedDuplicates, 1);
  assert.deepEqual(database.contacts.map((contact) => contact.platformName), ['First', 'No Email']);
});
