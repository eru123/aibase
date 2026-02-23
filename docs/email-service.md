# Email Service

AI Base uses PHPMailer for transactional email flows (invites, verification, password resets, notifications).

## SMTP configuration

SMTP credentials are managed through the **System Settings** page in the admin panel (`/system-settings/smtp`). No environment variables are needed.

Settings available via the admin UI:

- SMTP Host, Port, Username, Password
- Encryption (TLS/SSL/none)
- Sender name and email
- Use PHP `mail()` transport (overrides SMTP)
- Use AWS SES transport (overrides SMTP)

## Starter-template guidance

- Replace sender identity with your product domain.
- Confirm SPF/DKIM/DMARC on production domains.
- Keep template variable naming stable across backend payloads and frontend preview tooling.
