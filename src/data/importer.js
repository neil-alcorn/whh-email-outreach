import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DEFAULT_SHEETS = ['Sheet1', 'Sheet3'];
const PYTHON_WORKBOOK_READER = String.raw`
import datetime
import json
import sys
from openpyxl import load_workbook

def clean(value):
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return "" if value is None else value

path = sys.argv[1]
sheet_names = sys.argv[2:]
workbook = load_workbook(path, read_only=True, data_only=True)
output = []

for sheet_name in sheet_names:
    if sheet_name not in workbook.sheetnames:
        continue
    worksheet = workbook[sheet_name]
    rows = worksheet.iter_rows(values_only=True)
    headers = [str(cell).strip() if cell is not None else "" for cell in next(rows, [])]
    sheet_rows = []
    for offset, row in enumerate(rows, start=2):
        if not any(cell not in (None, "") for cell in row):
            continue
        values = {}
        for index, header in enumerate(headers):
            if header:
                values[header] = clean(row[index] if index < len(row) else "")
        sheet_rows.append({"sourceRow": offset, "values": values})
    output.append({"name": sheet_name, "rows": sheet_rows})

print(json.dumps(output))
`;

export function readWorkbookSheets(input, { pythonCommand = 'python', sheetNames = DEFAULT_SHEETS } = {}) {
  try {
    const output = execFileSync(
      pythonCommand,
      ['-c', PYTHON_WORKBOOK_READER, input, ...sheetNames],
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
    );
    return JSON.parse(output);
  } catch (error) {
    throw new Error([
      'Unable to read workbook. Install openpyxl for Python or pass --python <path-to-python-with-openpyxl>.',
      error.message,
    ].join(' '));
  }
}

export async function writeJsonFile(outputPath, data) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function buildOutreachDatabase({ sourceFile, importedAt = new Date().toISOString(), sheets }) {
  const seenEmails = new Set();
  let skippedDuplicates = 0;
  const contacts = [];

  for (const sheet of sheets) {
    for (const entry of sheet.rows) {
      const contact = normalizeContactRow({
        row: entry.values,
        sourceSheet: sheet.name,
        sourceRow: entry.sourceRow,
        sourceFile,
      });

      if (!contact.email && !contact.website) continue;
      if (contact.email && seenEmails.has(contact.email)) {
        skippedDuplicates += 1;
        continue;
      }
      if (contact.email) seenEmails.add(contact.email);
      contacts.push(contact);
    }
  }

  return {
    metadata: {
      sourceFile,
      importedAt,
      totalContacts: contacts.length,
      skippedDuplicates,
    },
    contacts,
  };
}

export function normalizeContactRow({ row, sourceSheet, sourceRow, sourceFile }) {
  const firstName = value(row['First Name']);
  const lastName = value(row['Last Name']);
  const authorName = value(row['Author Name']);
  const contactName = joinParts([firstName, lastName]) || authorName || value(row.Name);
  const email = value(row.Email || row['Primary Email']).toLowerCase();
  const platformName = value(row['Podcast/Platform Name'] || row['Site Name']);

  return {
    id: stableId({ sourceSheet, sourceRow, email, platformName }),
    source: {
      file: sourceFile,
      sheet: sourceSheet,
      row: sourceRow,
    },
    contactName,
    email,
    platformName,
    category: value(row.Category || row['Category Name']),
    website: value(row.Website || row['Site URL'] || row['Podcast Url']),
    description: value(row['Brief Description'] || row.Description),
    leadStatus: value(row['Lead Status']),
    initialContactDate: dateValue(row['Initial Contact Date']),
    followUpDate: dateValue(row['Follow-Up Date']),
    responseStatus: value(row['Response Status']),
    notes: value(row.Notes),
    reviewStatus: 'needs_review',
  };
}

function stableId({ sourceSheet, sourceRow, email, platformName }) {
  const basis = email || platformName || `row-${sourceRow}`;
  return slug(`${sourceSheet}-${sourceRow}-${basis}`);
}

function value(input) {
  if (input === undefined || input === null) return '';
  if (input instanceof Date) return dateValue(input);
  return String(input).trim();
}

function dateValue(input) {
  if (!input) return '';
  if (input instanceof Date && !Number.isNaN(input.valueOf())) {
    return input.toISOString().slice(0, 10);
  }
  return String(input).trim();
}

function joinParts(parts) {
  return parts.filter(Boolean).join(' ').trim();
}

function slug(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
