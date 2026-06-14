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
