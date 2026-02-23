---
name: Send Email
description: Send an email using PHPMailer
---

# Send Email

This skill sends emails using the project's `SmtpService`, which reads SMTP configuration from the database (System Settings).

## Prerequisites

- PHP installed
- Dependencies installed via `composer install`
- SMTP configured via the System Settings admin panel

## Usage

Run the `send_email.php` script from the project root:

```bash
php skills/send_email/send_email.php --to="recipient@example.com" --subject="Test Subject" --body="<h1>Hello via PHPMailer</h1>"
```

## Arguments

- `--to`: Email address of the recipient (required)
- `--subject`: Subject line of the email (required)
- `--body`: HTML body of the email (required)
- `--from`: Sender email (optional, defaults to sender configured in System Settings)
