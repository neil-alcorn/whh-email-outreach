import { neon } from '@neondatabase/serverless';

import { buildSurveyRecord, validateSurveyPayload } from '../../src/survey/schema.js';

const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, '');
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed.' });
  if (!sql) return response(500, { error: 'Survey database is not configured.' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { error: 'Invalid JSON body.' });
  }

  const validation = validateSurveyPayload(payload);
  if (!validation.valid) return response(400, { errors: validation.errors });

  const record = buildSurveyRecord(validation.value);
  const userAgent = (event.headers['user-agent'] || event.headers['User-Agent'] || '').slice(0, 500);
  const ipAddress = (event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '').slice(0, 80);

  try {
    await ensureTable();
    const rows = await sql`
      insert into whh_survey_responses (
        interests,
        update_preferences,
        follow_locations,
        frequency,
        explain_better,
        team_note,
        follow_up,
        respondent_name,
        respondent_email,
        respondent_phone,
        segment,
        source,
        user_agent,
        ip_address
      ) values (
        ${record.interestsJson}::jsonb,
        ${record.updatePreferencesJson}::jsonb,
        ${record.followLocationsJson}::jsonb,
        ${record.frequency},
        ${record.explainBetter},
        ${record.teamNote},
        ${record.followUp},
        ${record.name},
        ${record.email},
        ${record.phone},
        ${record.segment},
        ${record.source},
        ${userAgent},
        ${ipAddress}
      )
      returning id, created_at
    `;

    return response(200, { ok: true, id: rows[0].id, createdAt: rows[0].created_at });
  } catch (error) {
    console.error('survey-submit failed', error);
    return response(500, { error: 'Unable to save feedback right now.' });
  }
}

async function ensureTable() {
  await sql`
    create table if not exists whh_survey_responses (
      id bigint generated always as identity primary key,
      created_at timestamptz not null default now(),
      interests jsonb not null,
      update_preferences jsonb not null,
      follow_locations jsonb not null,
      frequency text not null,
      explain_better text not null default '',
      team_note text not null default '',
      follow_up text not null default 'none',
      respondent_name text not null default '',
      respondent_email text not null default '',
      respondent_phone text not null default '',
      segment text not null default 'unknown',
      source text not null default 'survey',
      user_agent text not null default '',
      ip_address text not null default ''
    )
  `;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'content-type': 'application/json; charset=utf-8',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}
