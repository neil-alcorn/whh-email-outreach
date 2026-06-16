import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSurveyRecord, validateSurveyPayload } from '../src/survey/schema.js';

test('validateSurveyPayload accepts a focused donor feedback response', () => {
  const result = validateSurveyPayload({
    interests: ['safe_homes', 'jobs_dignity'],
    updatePreferences: ['youtube_videos', 'founder_notes'],
    followLocations: ['youtube', 'email', 'mail', 'phone'],
    frequency: 'annually',
    explainBetter: 'How families are doing after they move in.',
    teamNote: 'Thank you for the updates.',
    followUp: 'email',
    name: 'Sample Donor',
    email: 'sample@example.com',
    segment: 'LYBUNT',
    source: 'email',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value.interests, ['safe_homes', 'jobs_dignity']);
  assert.equal(result.value.frequency, 'annually');
  assert.equal(result.value.segment, 'LYBUNT');
});

test('validateSurveyPayload rejects empty responses and invalid choices', () => {
  const result = validateSurveyPayload({
    interests: [],
    updatePreferences: ['not_real'],
    followLocations: ['youtube'],
    frequency: 'weekly',
    email: 'not-an-email',
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Choose at least one area/);
  assert.match(result.errors.join('\n'), /Invalid update preference/);
  assert.match(result.errors.join('\n'), /Invalid update frequency/);
  assert.match(result.errors.join('\n'), /Enter a valid email/);
});

test('buildSurveyRecord prepares JSON fields for database insertion', () => {
  const record = buildSurveyRecord({
    interests: ['discipleship'],
    updatePreferences: ['prayer_requests'],
    followLocations: ['instagram'],
    frequency: 'monthly',
    followUp: 'none',
    segment: 'SYBUNT',
  });

  assert.equal(record.frequency, 'monthly');
  assert.equal(record.followUp, 'none');
  assert.equal(record.segment, 'SYBUNT');
  assert.equal(record.interestsJson, JSON.stringify(['discipleship']));
  assert.equal(record.updatePreferencesJson, JSON.stringify(['prayer_requests']));
  assert.equal(record.followLocationsJson, JSON.stringify(['instagram']));
});
