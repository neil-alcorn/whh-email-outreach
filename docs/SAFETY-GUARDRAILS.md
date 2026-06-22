# Safety Guardrails

## Sending Rules

- Maximum 15 outreach emails per day by default.
- Each email should be personalized.
- Do not send to contacts marked declined, bounced, or do not contact.
- Stop outreach immediately if someone asks not to be contacted.
- Avoid misleading subject lines or overstated Haiti statistics.
- Avoid using crisis-only messaging as the pitch.

## Approval Rules

Default mode is approval before send. The system may generate drafts and queue messages, but it should not send unless Neil explicitly approves the batch or a specific message.

## Data Rules

- Do not commit `.env`, raw contact lists, mailbox caches, or email logs.
- Do not paste large contact lists into chats.
- Store sensitive local files only under ignored paths.
- Keep source links and research notes for new contacts.

## Deliverability Notes

- Keep daily volume low.
- Use plain, human-sounding emails.
- Avoid heavy images or attachments in first-touch outreach.
- Include a simple opt-out line when appropriate.
- Watch for bounces and stop sending to bad addresses.

## Rackspace/Cybernautic Lockout Lesson

In June 2026, the WHH mailbox was locked after a donor outreach batch of roughly 100 SMTP-sent messages. Cybernautic confirmed the likely cause was batch velocity and an unusual sending spike from a standard mailbox, not an incorrect password.

Rackspace hosted email has a published daily recipient limit, but that number is not a safe planning target for donor outreach. Rackspace also applies much lower, unpublished restrictions to automated email and can change limits without warning.

Operational rules from this incident:

- Treat `neil@welcomehomehaiti.com` as a person-to-person mailbox, not a bulk email platform.
- Do not run continuous send loops from the WHH mailbox.
- Keep the default cap at 15 approved outreach emails per day unless Neil explicitly changes it after reviewing deliverability risk.
- Pause immediately on SMTP auth failures, quota/rate-limit errors, abnormal bounces, or support lockout warnings.
- Avoid unnecessary BCC copies on live batches because recipient count, not message count, is what Rackspace measures.
- For larger donor campaigns, prefer a reputable email service provider with unsubscribe handling, list hygiene, authentication, and warming controls.
