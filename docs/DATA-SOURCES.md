# Data Sources

## First File To Use

`C:\Users\nalco\GitRepos\whh-context\social-media\sensitive-source-docs\WHH_Podcast_Outreach_Tracking.xlsx`

Known structure:

- `Sheet1`: working outreach tracker with contact name, email, podcast/platform name, category, website, lead status, contact dates, response status, and notes.
- `Sheet2`: smaller podcast/category list.
- `Sheet3`: larger source/contact list with lead status, site URL, description, site name, author name, primary email, social links, and category.

## Secondary Source

`C:\Users\nalco\GitRepos\whh-context\social-media\sensitive-source-docs\_BloggerOutreach_neil@welcomehomehaiti.com_26thFeb2025.xlsx`

Known structure:

- `Media Contact Lists`: original/raw media contact export.
- `Summary`: high-level source summary.

## Donor And Salesforce Sources

Primary donor work should use current Salesforce/Lifesong data before any segmented donor outreach.

Known local donor app:

- `C:\Users\nalco\GitRepos\whh-donor-management-app`
- Useful reports/endpoints: LYBUNT, SYBUNT, donor segments, donations, campaign performance, exports.
- Confirm whether May-June 2026 donations have been imported before classifying donors for Spring Campaign follow-up.

Salesforce CLI:

- Use `sf.cmd` rather than `sf` in PowerShell because the `.ps1` shim may be blocked by execution policy.
- Authenticated org alias observed June 2026: `welcomehome`.
- Use Salesforce/Lifesong sync/export as the source of truth for current gift status, campaign gifts, match/challenge gift records, and contact records.

Donor outreach send/receive rule:

- Use `neil@welcomehomehaiti.com` for donor outreach and response monitoring.
- Gmail is for summary/internal support only unless Neil explicitly changes this rule.

## Data Handling Rules

- Do not commit raw contact lists to Git.
- Do not print large lists of email addresses in chat.
- Keep local working exports in `data/ignored/` or the WHH context `sensitive-source-docs` folder.
- Track only what is needed for outreach status, follow-up, and response review.
- Keep a source field for every researched or enriched contact.
- Do not expose internal donor labels such as LYBUNT, LYBNT, SYBUNT, SYBNT, major, mid-level, or lapsed in donor-facing copy.
- Do not use exact giving dates, amounts, lifetime giving, or milestones in mass/semi-mass emails. Reserve that level of detail for true one-to-one reviewed calls or notes.
- Suppress unsubscribed, bounced, internal, board, duplicate, and do-not-contact records before any send.

## Research Expansion

When adding new contacts through research, capture:

- show or site name
- host or contact name
- public email or contact form URL
- website
- social links
- audience fit
- why WHH is relevant
- suggested personalized angle
- source URL
- research date
