# Ecosystem Direction — whh-email-outreach

**Canonical strategy:** `whh-context/systems/ecosystem-go-forward-strategy-2026-06.md`
(All WHH repos are onboarded into **Conduit** to work together.)

## This repo's role
**Donor stewardship & outreach** in the WHH ecosystem: the email outreach app and the donor
**feedback survey** (deploys the `whh-donor-feedback` site). Survey responses land in the shared
Neon DB (`whh_survey_responses`) read by the donor app, closing the listen/engage loop.

## Principles (inherited)
- **Lifesong = giving truth**; **Salesforce = CRM of record**; outreach reads donor data, never
  becomes a giving source.
- Outreach segments (LYBUNT/SYBUNT, lapsed, major/mid) come from the donor app's intelligence —
  keep definitions consistent with the board report and the SF enrichment back-port.
- Stewardship serves the strategic priorities (re-engage lapsed, grow monthly, retention) and the
  banquet/year-end calendar.

## Ties into
- `whh-donor-management-app` (donor data, segments, survey storage in shared Neon).
- `whh-context` (campaigns, storytelling, strategy).
