const form = document.querySelector('#survey-form');
const message = document.querySelector('#form-message');
const thanks = document.querySelector('#thanks');
const segmentInput = document.querySelector('#segment');
const sourceInput = document.querySelector('#source');

const params = new URLSearchParams(window.location.search);
segmentInput.value = normalizeSegment(params.get('segment') || params.get('s') || 'unknown');
sourceInput.value = (params.get('source') || 'survey').slice(0, 120);

for (const group of document.querySelectorAll('[data-limit]')) {
  const limit = Number.parseInt(group.dataset.limit, 10);
  group.addEventListener('change', () => enforceLimit(group, limit));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('Sending your feedback...', false);
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  const payload = collectPayload(new FormData(form));
  const localErrors = validatePayload(payload);
  if (localErrors.length) {
    button.disabled = false;
    setMessage(localErrors.join(' '), true);
    return;
  }

  try {
    await submitFeedback(payload);
    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    button.disabled = false;
    setMessage(error.message || 'Unable to save feedback right now.', true);
  }
});

async function submitFeedback(payload) {
  try {
    const response = await fetch('/.netlify/functions/survey-submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getErrorMessage(result));
    }
  } catch (error) {
    await submitNetlifyForm(payload);
  }
}

async function submitNetlifyForm(payload) {
  const body = new URLSearchParams();
  body.set('form-name', 'whh-donor-feedback');
  body.set('segment', payload.segment);
  body.set('source', payload.source);
  body.set('interests', payload.interests.join(', '));
  body.set('updatePreferences', payload.updatePreferences.join(', '));
  body.set('followLocations', payload.followLocations.join(', '));
  body.set('frequency', payload.frequency);
  body.set('explainBetter', payload.explainBetter);
  body.set('teamNote', payload.teamNote);
  body.set('followUp', payload.followUp);
  body.set('name', payload.name);
  body.set('email', payload.email);
  body.set('phone', payload.phone);

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error('Unable to save feedback right now.');
}

function getErrorMessage(result) {
  if (Array.isArray(result.errors)) return result.errors.join(' ');
  if (Array.isArray(result.error)) return result.error.join(' ');
  if (typeof result.error === 'string') return result.error;
  return 'Unable to save feedback.';
}

function collectPayload(formData) {
  return {
    interests: formData.getAll('interests'),
    updatePreferences: formData.getAll('updatePreferences'),
    followLocations: formData.getAll('followLocations'),
    frequency: formData.get('frequency') || '',
    explainBetter: formData.get('explainBetter') || '',
    teamNote: formData.get('teamNote') || '',
    followUp: formData.get('followUp') || 'none',
    name: formData.get('name') || '',
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    segment: formData.get('segment') || 'unknown',
    source: formData.get('source') || 'survey',
  };
}

function validatePayload(payload) {
  const errors = [];
  if (!payload.interests.length) errors.push('Choose at least one WHH work area.');
  if (!payload.updatePreferences.length) errors.push('Choose at least one update type.');
  if (!payload.followLocations.length) errors.push('Choose how you prefer to hear about WHH.');
  if (!payload.frequency) errors.push('Choose an update frequency.');
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.push('Enter a valid email address or leave it blank.');
  }
  return errors;
}

function enforceLimit(group, limit) {
  const checked = [...group.querySelectorAll('input[type="checkbox"]:checked')];
  const unchecked = [...group.querySelectorAll('input[type="checkbox"]:not(:checked)')];
  const disabled = checked.length >= limit;
  for (const input of unchecked) input.disabled = disabled;
}

function setMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function normalizeSegment(segment) {
  const allowed = new Set(['LYBUNT', 'SYBUNT', 'current_donor', 'past_donor', 'board', 'friend', 'unknown']);
  return allowed.has(segment) ? segment : 'unknown';
}
