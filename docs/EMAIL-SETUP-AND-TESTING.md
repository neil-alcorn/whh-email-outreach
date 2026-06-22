# Email Setup And Testing

## What We Need Locally

The connector reads mailbox credentials from a local `.env` file. Do not commit this file and do not paste the password into chat.

Required values:

- `WHH_EMAIL_ADDRESS`: the WHH mailbox to send from, for example `neil@welcomehomehaiti.com`
- `WHH_EMAIL_DISPLAY_NAME`: sender name shown to recipients, for example `Neil Alcorn | Welcome Home Haiti`
- `WHH_EMAIL_PASSWORD`: the mailbox password or app password
- `IMAP_HOST`: `secure.emailsrvr.com`
- `IMAP_PORT`: `993`
- `IMAP_SECURE`: `true`
- `SMTP_HOST`: `secure.emailsrvr.com`
- `SMTP_PORT`: `465`
- `SMTP_SECURE`: `true`
- `SUMMARY_RECIPIENT_EMAIL`: summary recipient, currently `nalcorn22@gmail.com`

The WHH mailbox is the source of truth for outreach sending and reply monitoring. Gmail is only used as a summary recipient and as a controlled test address when verifying the connector.

## Cybernautic Support

- Support portal: `http://support.cybernautic.com`
- Support email: `support@cybernautic.com`
- Primary support contact: Missy Freese, `clientservices@cybernautic.net`
- Webmail: `https://webmail.emailsrvr.com/`
- Email setup help: `https://help.emailsrvr.com`

If SMTP returns `535 5.7.8 Error: authentication failed`, stop outreach sends and contact Cybernautic support to check for a mailbox lock, password reset, or app-password requirement.

June 2026 lockout note: Cybernautic confirmed that the WHH mailbox can be locked when donor outreach looks like automated/bulk sending from a standard mailbox. The normal mailbox password remains the SMTP/IMAP password; there is no separate app password. Do not resume batch sending until the account is confirmed unlocked and the send plan has been reduced or moved to an email service provider.

## Commands

Show masked config:

```powershell
npm run cli -- check-config
```

Send one test email:

```powershell
npm run cli -- send-test -- --to nalcorn22@gmail.com
```

Read recent inbox metadata:

```powershell
npm run cli -- recent-inbox -- --limit 5
```

## Expected Test Flow

1. Confirm `.env` has the WHH mailbox address and password.
2. Run `check-config` and confirm the email address is correct and the password is masked.
3. Run `send-test` from the WHH mailbox to Neil's Gmail.
4. Confirm the test message arrives in Gmail.
5. Reply from Gmail to the WHH mailbox.
6. Run `recent-inbox` and confirm the reply metadata appears.

## Summary Recipient

Use Neil's primary Gmail address for status and response summaries only:

```env
SUMMARY_RECIPIENT_EMAIL=nalcorn22@gmail.com
```

## Safety Notes

- The test email command sends only one message to the requested recipient.
- The inbox command prints metadata only: UID, date, from, subject, and flags.
- Message bodies are not printed by default.
- Operational outreach sends from the WHH mailbox and replies are monitored in the WHH mailbox.
- Outreach batch sending is not implemented yet.
