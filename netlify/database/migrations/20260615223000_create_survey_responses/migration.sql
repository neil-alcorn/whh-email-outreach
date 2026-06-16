CREATE TABLE IF NOT EXISTS "whh_survey_responses" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "interests" jsonb NOT NULL,
  "update_preferences" jsonb NOT NULL,
  "follow_locations" jsonb NOT NULL,
  "frequency" text NOT NULL,
  "explain_better" text NOT NULL DEFAULT '',
  "team_note" text NOT NULL DEFAULT '',
  "follow_up" text NOT NULL DEFAULT 'none',
  "respondent_name" text NOT NULL DEFAULT '',
  "respondent_email" text NOT NULL DEFAULT '',
  "respondent_phone" text NOT NULL DEFAULT '',
  "segment" text NOT NULL DEFAULT 'unknown',
  "source" text NOT NULL DEFAULT 'survey',
  "user_agent" text NOT NULL DEFAULT '',
  "ip_address" text NOT NULL DEFAULT ''
);
