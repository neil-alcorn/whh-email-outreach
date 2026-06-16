const INTERESTS = new Set([
  'safe_homes',
  'jobs_dignity',
  'discipleship',
  'family_worker_stories',
  'community_needs',
  'gift_impact',
  'pray_share',
]);

const UPDATE_PREFERENCES = new Set([
  'youtube_videos',
  'photos_captions',
  'email_stories',
  'founder_notes',
  'impact_numbers',
  'prayer_requests',
  'behind_scenes',
]);

const FOLLOW_LOCATIONS = new Set(['youtube', 'facebook', 'instagram', 'email', 'mail', 'phone', 'text', 'not_sure']);
const FREQUENCIES = new Set(['monthly', 'quarterly', 'annually', 'campaigns', 'few_times_year']);
const FOLLOW_UPS = new Set(['none', 'email', 'phone']);
const SEGMENTS = new Set(['LYBUNT', 'SYBUNT', 'current_donor', 'past_donor', 'board', 'friend', 'unknown']);

export function validateSurveyPayload(payload = {}) {
  const errors = [];
  const value = {
    interests: normalizeArray(payload.interests),
    updatePreferences: normalizeArray(payload.updatePreferences),
    followLocations: normalizeArray(payload.followLocations),
    frequency: cleanString(payload.frequency),
    explainBetter: cleanText(payload.explainBetter, 1200),
    teamNote: cleanText(payload.teamNote, 1200),
    followUp: cleanString(payload.followUp || 'none'),
    name: cleanText(payload.name, 160),
    email: cleanString(payload.email).toLowerCase(),
    phone: cleanText(payload.phone, 80),
    segment: normalizeSegment(payload.segment),
    source: cleanText(payload.source || 'survey', 120),
  };

  if (!value.interests.length) errors.push('Choose at least one area of WHH work.');
  for (const interest of value.interests) {
    if (!INTERESTS.has(interest)) errors.push(`Invalid interest: ${interest}`);
  }

  if (!value.updatePreferences.length) errors.push('Choose at least one update type.');
  for (const preference of value.updatePreferences) {
    if (!UPDATE_PREFERENCES.has(preference)) errors.push(`Invalid update preference: ${preference}`);
  }

  if (!value.followLocations.length) errors.push('Choose where you are most likely to follow WHH.');
  for (const location of value.followLocations) {
    if (!FOLLOW_LOCATIONS.has(location)) errors.push(`Invalid follow location: ${location}`);
  }

  if (!FREQUENCIES.has(value.frequency)) errors.push('Invalid update frequency.');
  if (!FOLLOW_UPS.has(value.followUp)) errors.push('Invalid follow-up preference.');
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.push('Enter a valid email address.');

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    value,
  };
}

export function buildSurveyRecord(value) {
  return {
    interestsJson: JSON.stringify(value.interests || []),
    updatePreferencesJson: JSON.stringify(value.updatePreferences || []),
    followLocationsJson: JSON.stringify(value.followLocations || []),
    frequency: value.frequency || '',
    explainBetter: value.explainBetter || '',
    teamNote: value.teamNote || '',
    followUp: value.followUp || 'none',
    name: value.name || '',
    email: value.email || '',
    phone: value.phone || '',
    segment: normalizeSegment(value.segment),
    source: value.source || 'survey',
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return [...new Set(value.map(cleanString).filter(Boolean))];
  if (typeof value === 'string' && value) return [cleanString(value)];
  return [];
}

function cleanString(value) {
  return String(value || '').trim();
}

function cleanText(value, maxLength) {
  return cleanString(value).replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeSegment(segment) {
  const value = cleanString(segment);
  return SEGMENTS.has(value) ? value : 'unknown';
}
