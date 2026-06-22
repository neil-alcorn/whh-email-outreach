# QA & Acceptance: whh-email-outreach

## Smoke Checks

| ID | Check | Command / Evidence |
|---|---|---|
| AC-001 | Syntax checks pass | `npm run check` |
| AC-002 | Tests pass | `npm test` |
| AC-003 | Survey deploy target is the WHH email/survey site | `npm run verify:netlify` |
| AC-004 | Real outreach sending is not triggered by cleanup work | Review CLI command history and changed files |

## Acceptance Notes

- Outreach logs and contact exports under `data/ignored/` are intentionally not committed.
- Keep WHH mailbox credentials and raw contact lists out of Git.
- Respect the safe-send posture documented in `README.md`.
