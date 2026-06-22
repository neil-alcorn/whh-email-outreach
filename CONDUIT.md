<!--
# ── CONDUIT MANAGED FILE ────────────────────────────────────────────
# file:        CONDUIT.md
# description: Highway document for whh-email-outreach. Repo signals and agent rules.
# owner:       BOTH
# update:      When repo signals or operating rules change.
# schema:      highways/repo-signals.schema.yaml
# last_update: 2026-06-22
# ─────────────────────────────────────────────────────────────────────
-->

# whh-email-outreach

WHH Email Outreach is the local outreach connector, survey workflow, and safe-send operating system for Welcome Home Haiti.

## Repo Signals

```yaml
operational_status: ACTIVE
system_class: MODERN
escalation_contacts:
  owner: "Neil Alcorn"
  architect: "Neil Alcorn"
  security: "Neil Alcorn"
  compliance: ""
  specialist: ""
highway_init_date: "2026-06-22"
last_context_update: "2026-06-22"
```

## What This Repo Is

This repo manages WHH outreach tooling, mailbox connector behavior, donor feedback survey deployment, and reporting/export helpers.

- **Type:** active-tool
- **Tech Stack:** Node.js, SMTP/IMAP, Netlify Functions, Netlify Database/Neon, static survey frontend



## What Agents May Do Here

- Read all source files for context and analysis
- Implement changes within active convoy workstreams
- Run tests and build commands
- Create branches for convoy work
- Generate CONTEXT.md updates (subject to owner approval)

## What Agents Must Not Do Here

- Push to main without convoy approval
- Send real outreach, change daily send limits, alter mailbox credentials, or deploy survey infrastructure without owner review

### Files/Directories Agents Must Not Touch

- .env files
- `.env` files
- `data/ignored/` outreach logs and contact exports
- Raw contact lists, mailbox credentials, and donor PII
- Migration files that have already run in production



## Data Relationships

Consumes curated messaging/source context from `whh-context` and may provide outreach metrics for donor-management or board reporting workflows.
