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
3. Run `send-test` to Neil's Gmail.
4. Confirm the test message arrives in Gmail.
5. Reply from Gmail to the WHH mailbox.
6. Run `recent-inbox` and confirm the reply metadata appears.

## Safety Notes

- The test email command sends only one message to the requested recipient.
- The inbox command prints metadata only: UID, date, from, subject, and flags.
- Message bodies are not printed by default.
- Outreach batch sending is not implemented yet.
