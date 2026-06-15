# Donor Feedback Survey

The donor feedback survey is a Netlify-ready static page with a Neon-backed serverless submit endpoint.

## Local Files

- Page: `public/survey/index.html`
- Styles: `public/survey/styles.css`
- Browser behavior: `public/survey/survey.js`
- Netlify function: `netlify/functions/survey-submit.js`
- Shared validation: `src/survey/schema.js`

## Deploy Settings

Netlify:

- Publish directory: `public`
- Functions directory: `netlify/functions`

Database env var, in priority order:

1. `NETLIFY_DATABASE_URL`
2. `DATABASE_URL`
3. `NEON_DATABASE_URL`

The function creates the `whh_survey_responses` table automatically on first successful submit.

## Response Table

Table: `whh_survey_responses`

- `id`
- `created_at`
- `interests` JSONB
- `update_preferences` JSONB
- `follow_locations` JSONB
- `frequency`
- `explain_better`
- `team_note`
- `follow_up`
- `respondent_name`
- `respondent_email`
- `respondent_phone`
- `segment`
- `source`
- `user_agent`
- `ip_address`

## Segment Links

Use low-sensitivity tags only:

```text
/survey/?segment=LYBUNT&source=email
/survey/?segment=SYBUNT&source=email
/survey/?segment=current_donor&source=email
/survey/?segment=past_donor&source=email
```

Do not put gift amounts, household names, Salesforce IDs, donor scores, or private notes in URLs.

## Content Posture

This survey is a feedback and engagement tool, not a disguised donation form.

It asks what donors want to hear more about, what update formats help them feel connected, where they may follow/share WHH updates, and whether they want follow-up.

It intentionally avoids asking:

- likelihood to donate in the next 12 months
- planned or legacy giving interest
- exact giving history
- why someone has not given recently
