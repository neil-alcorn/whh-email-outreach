# Email Connector Design

## Purpose

Create a local connector that can read and send WHH email through the Cybernautic-hosted mailbox using IMAP and SMTP.

## Mail Settings

From Cybernautic support:

- IMAP server: `secure.emailsrvr.com`
- IMAP port: `993`
- IMAP SSL: `true`
- SMTP server: `secure.emailsrvr.com`
- SMTP port: `465`
- SMTP SSL: `true`
- Username: full WHH email address
- Password: mailbox password or app password if available

## Cybernautic Support

- Support portal: `http://support.cybernautic.com`
- Support email: `support@cybernautic.com`
- Primary support contact: Missy Freese, `clientservices@cybernautic.net`
- Webmail: `https://webmail.emailsrvr.com/`
- Email setup help: `https://help.emailsrvr.com`

If the WHH mailbox is locked, webmail fails, or SMTP returns `535 5.7.8 Error: authentication failed`, pause automated SMTP attempts and contact Cybernautic support for an unlock, password reset, or app-password guidance.

June 2026 lockout note: Cybernautic confirmed that a WHH SMTP lockout was likely caused by donor-batch velocity and an unusual spike from a standard mailbox. Rackspace's published hosted-email limit is not a safe outreach target because automated email is restricted at lower, unpublished thresholds. Keep live WHH-mailbox sending slow and person-to-person; use an email service provider or support-approved plan for larger batches.

## Capabilities

V1 should support:

- connection test without exposing credentials
- read recent inbox messages
- search for replies to outreach subject/thread markers
- create a daily queue of up to 15 personalized emails
- require approval before sending
- send approved emails through SMTP
- log message metadata locally
- classify replies as interested, declined, bounced, no response, follow-up needed, or scheduled

## Non-Goals For V1

- no bulk blasting
- no automatic send without approval
- no credential storage in Git
- no public GitHub storage of contact data or email logs
- no complex CRM replacement

## Preferred Technical Shape

A local command-line tool is enough for V1. It can later grow into a small web dashboard if needed.

Recommended components:

- config loader for `.env`
- IMAP client for reading mailbox and monitoring replies
- SMTP client for sending approved messages
- contact importer for the outreach workbooks
- local SQLite database for queue/status/logs
- report command for daily summary
