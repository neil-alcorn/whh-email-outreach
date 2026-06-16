# Donor Feedback Survey

The donor feedback survey is a Netlify-ready static page with a Postgres-backed serverless submit endpoint.

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

1. `NETLIFY_DB_URL`
2. `NETLIFY_DATABASE_URL`
3. `DATABASE_URL`
4. `NEON_DATABASE_URL`

The function creates the `whh_survey_responses` table automatically on first successful submit.

Current deployment note: Netlify Forms is enabled as the live capture fallback. If the SQL function cannot find a database URL, the browser posts the same validated response to the `whh-donor-feedback` Netlify form so responses are still exportable. Before moving to SQL reporting, set one of the env vars above to a Neon/Postgres connection string, redeploy, and run a smoke-test submission.

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
https://whh-donor-feedback.netlify.app/?segment=LYBUNT&source=email
https://whh-donor-feedback.netlify.app/?segment=SYBUNT&source=email
https://whh-donor-feedback.netlify.app/?segment=current_donor&source=email
https://whh-donor-feedback.netlify.app/?segment=past_donor&source=email
```

Do not put gift amounts, household names, Salesforce IDs, donor scores, or private notes in URLs.

## Reporting

Current response data is available in Netlify Forms under `whh-donor-feedback`.

Once the database env var is set, SQL response data is available from `whh_survey_responses`.

Useful starter query:

```sql
select
  created_at,
  segment,
  source,
  interests,
  update_preferences,
  follow_locations,
  frequency,
  follow_up
from whh_survey_responses
order by created_at desc;
```

## Content Posture

This survey is a feedback and engagement tool, not a disguised donation form.

It asks what donors want to hear more about, what update formats help them feel connected, where they may follow/share WHH updates, and whether they want follow-up.

It intentionally avoids asking:

- likelihood to donate in the next 12 months
- planned or legacy giving interest
- exact giving history
- why someone has not given recently
