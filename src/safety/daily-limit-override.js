export function authorizeDailyLimitOverride({
  alreadySentToday,
  pendingCount,
  configuredLimit,
  overrideToken,
  acknowledgedAt = new Date().toISOString(),
}) {
  const projectedTotal = alreadySentToday + pendingCount;
  if (projectedTotal <= configuredLimit) return null;

  if (overrideToken !== 'I_UNDERSTAND_RISK') {
    throw new Error(
      `The projected daily total is ${projectedTotal}; the configured limit is ${configuredLimit}. `
      + 'Use --override-daily-limit I_UNDERSTAND_RISK only with explicit authorization.',
    );
  }

  return {
    acknowledged: true,
    configured_limit: configuredLimit,
    already_sent_today: alreadySentToday,
    pending_count: pendingCount,
    projected_total: projectedTotal,
    acknowledged_at: acknowledgedAt,
  };
}
