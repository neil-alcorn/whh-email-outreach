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
    const response = await fetch('/.netlify/functions/survey-submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error((result.errors || result.error || ['Unable to save feedback.']).join(' '));
    }

    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    button.disabled = false;
    setMessage(error.message || 'Unable to save feedback right now.', true);
  }
});

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
  if (!payload.followLocations.length) errors.push('Choose where you are most likely to follow WHH.');
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
