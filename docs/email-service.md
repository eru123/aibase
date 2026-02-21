# AI Base Email Service

AI Base uses PHPMailer to deliver transactional email (MFA, invitations, password resets). Configure SMTP credentials in `.env`.

Example `.env` values:

```bash
SMTP_HOST=email-smtp.example.com
SMTP_PORT=465
SMTP_USER=<YOUR_SMTP_USER>
SMTP_PASS=<YOUR_SMTP_PASS>
SMTP_SECURE=true
SMTP_SENDER_NAME="Billing"
SMTP_SENDER_EMAIL=no-reply@billing.local
SMTP_MAIL=false
```

Set `SMTP_MAIL=true` to use PHP's built-in `mail()` transport instead of SMTP.
