# WHH Email Outreach

Local outreach workspace for Welcome Home Haiti podcast, blogger, and media outreach.

## Goal

Use carefully researched, personalized email outreach to increase WHH exposure. A successful outcome can be a podcast interview, article mention, social follow, social share, referral, or warm relationship. New followers on WHH social channels are a win.

The outreach posture is awareness and relationship first, not immediate fundraising.

## Scope

This repo is for the email outreach engine and operating system only. It should not become the full WHH knowledge base and should not store raw contact lists or mailbox credentials in Git.

## Related Repos And Folders

- WHH context repo: `C:\Users\nalco\GitRepos\whh-context`
- Podcast outreach context: `C:\Users\nalco\GitRepos\whh-context\social-media\PODCAST-AND-INFLUENCER-OUTREACH.md`
- Sensitive outreach source index: `C:\Users\nalco\GitRepos\whh-context\social-media\SENSITIVE-OUTREACH-SOURCES.md`
- Local sensitive source files: `C:\Users\nalco\GitRepos\whh-context\social-media\sensitive-source-docs`
- Original OneDrive outreach folder: `C:\Users\nalco\OneDrive\WHH\WHH Donor Management\Sensitive Working Files\Outreach Tracking`

## First Source File

Start with:

`C:\Users\nalco\GitRepos\whh-context\social-media\sensitive-source-docs\WHH_Podcast_Outreach_Tracking.xlsx`

Then expand with our own research and enrichment.

## Operating Principle

No blind blasting. The system should research, personalize, queue, and track. Sending should stay limited to 15 approved outreach emails per day unless Neil explicitly changes the limit.

All outreach sending and reply monitoring must use the configured WHH mailbox over SMTP/IMAP. Neil's Gmail address is only a summary/test recipient; it is not the operational outreach mailbox.

Start from `docs/ENGAGEMENT-MESSAGING-PRINCIPLES.md` before drafting or sending outreach.

## Current Connector Commands

```powershell
npm run cli -- check-config
npm run cli -- send-test -- --to nalcorn22@gmail.com
npm run cli -- recent-inbox -- --limit 5
npm run cli -- import-workbook -- --input C:\Users\nalco\GitRepos\whh-context\social-media\sensitive-source-docs\WHH_Podcast_Outreach_Tracking.xlsx --out data\ignored\outreach-contacts.json --python <path-to-python-with-openpyxl>
```

See `docs/EMAIL-SETUP-AND-TESTING.md` for the first send/receive test flow.

## Donor Feedback Survey

The Netlify-ready donor feedback page lives at `public/survey/index.html` and posts to `netlify/functions/survey-submit.js`.

Deploy with Netlify using:

- Publish directory: `public`
- Functions directory: `netlify/functions`
- Neon/Postgres env var: `NETLIFY_DB_URL`, `NETLIFY_DATABASE_URL`, `DATABASE_URL`, or `NEON_DATABASE_URL`

Example tagged links:

```text
https://whh-donor-feedback.netlify.app/?segment=LYBUNT&source=email
https://whh-donor-feedback.netlify.app/?segment=SYBUNT&source=email
```

See `docs/DONOR-SURVEY.md` for the response schema and privacy notes.

## Summary Recipient

Daily or manual response summaries should go to the address configured in local `.env`. This is for reporting only; do not use it to send outreach or monitor outreach replies.

```env
SUMMARY_RECIPIENT_EMAIL=nalcorn22@gmail.com
```
