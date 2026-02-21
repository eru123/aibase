# AI Base Deployment Guide

This guide summarizes a basic deployment flow for AI Base. Adjust infrastructure settings to meet your organization's security and compliance requirements.

## Build Assets

```bash
pnpm build
```

## Install Backend Dependencies

```bash
composer install --no-dev --optimize-autoloader
```

## Configure Environment

Set environment values in `.env` (or your secrets manager):

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_NAME`, `SMTP_SENDER_EMAIL`, `SMTP_MAIL`

## Run Migrations

```bash
vendor/bin/phinx migrate
vendor/bin/phinx seed:run -s OtpMethodsSeeder
```

## Web Server

Serve `index.php` from the project root, and ensure the `/api` directory is reachable for backend requests. The SPA fallback remains in `index.php`, so keep routing intact when configuring your web server.
