import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeDailyLimitOverride } from '../src/safety/daily-limit-override.js';

test('allows a campaign within the configured daily limit without an override', () => {
  assert.equal(authorizeDailyLimitOverride({
    alreadySentToday: 5,
    pendingCount: 10,
    configuredLimit: 15,
    overrideToken: '',
  }), null);
});

test('rejects a campaign over the configured daily limit without the exact acknowledgement', () => {
  assert.throws(() => authorizeDailyLimitOverride({
    alreadySentToday: 10,
    pendingCount: 15,
    configuredLimit: 15,
    overrideToken: '',
  }), /projected daily total is 25.*configured limit is 15/i);
});

test('returns an audit record when the exact daily-limit acknowledgement is supplied', () => {
  const audit = authorizeDailyLimitOverride({
    alreadySentToday: 10,
    pendingCount: 15,
    configuredLimit: 15,
    overrideToken: 'I_UNDERSTAND_RISK',
    acknowledgedAt: '2026-10-07T15:00:00.000Z',
  });

  assert.deepEqual(audit, {
    acknowledged: true,
    configured_limit: 15,
    already_sent_today: 10,
    pending_count: 15,
    projected_total: 25,
    acknowledged_at: '2026-10-07T15:00:00.000Z',
  });
});
