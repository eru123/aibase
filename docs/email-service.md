# Email Service

AI Base uses PHPMailer for transactional email flows (invites, verification, password resets, notifications).

## SMTP configuration

Set values in `.env`:

```bash
SMTP_HOST=email-smtp.example.com
SMTP_PORT=465
SMTP_USER=<YOUR_SMTP_USER>
SMTP_PASS=<YOUR_SMTP_PASS>
SMTP_SECURE=true
SMTP_SENDER_NAME="AIBase"
SMTP_SENDER_EMAIL=no-reply@aibase.local
SMTP_MAIL=false
```

`SMTP_MAIL=true` switches transport to PHP `mail()`.

## Starter-template guidance

- Replace sender identity with your product domain.
- Confirm SPF/DKIM/DMARC on production domains.
- Keep template variable naming stable across backend payloads and frontend preview tooling.
