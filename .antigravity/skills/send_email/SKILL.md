---
name: Send Email
description: Send an email using PHPMailer
---

# Send Email

This skill allows you to send emails using a PHP script that leverages the project's existing PHPMailer dependency and configuration.

## Prerequisites

- PHP installed
- Dependencies installed via `composer install`
- `.env` file configured with SMTP settings

## Usage

Run the `send_email.php` script from the project root or skill directory:

```bash
php .antigravity/skills/send_email/send_email.php --to="recipient@example.com" --subject="Test Subject" --body="<h1>Hello via PHPMailer</h1>"
```

## Arguments

- `--to`: Email address of the recipient (required)
- `--subject`: Subject line of the email (required)
- `--body`: HTML body of the email (required)
- `--from`: Sender email (optional, defaults to SMTP_SENDER_EMAIL in .env)
