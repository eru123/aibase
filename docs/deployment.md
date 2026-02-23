# Deployment Guide

This document describes the baseline deployment flow for AI Base as a starter template.

## 1) Build frontend assets

```bash
pnpm build
```

## 2) Install backend dependencies

```bash
composer install --no-dev --optimize-autoloader
```

## 3) Configure runtime environment

Set values in `.env` (or a secrets manager):

- Core app: `VITE_API_URL`, `VITE_APP_URL`
- Database: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`
- Optional branding: `VITE_APP_NAME`, `VITE_APP_SHORT_NAME`, `VITE_COMPANY_NAME`, `VITE_HOTEL_BRAND_NAME`
- SMTP: Configure via the System Settings admin panel after deployment

## 4) Run database migrations

```bash
pnpm db:migrate
```

## 5) Serve the application

Serve the project root through PHP with `index.php` as the entry point so both API routes and SPA fallback routing work correctly.

Example:

```bash
php -S 0.0.0.0:8000 index.php
```

In production, map your web server to route requests through `index.php` while serving static build assets from `dist/`.

## 6) Post-deploy checks

- Validate login, refresh token flow, and logout.
- Validate admin-only routes are protected.
- Validate email delivery paths (or graceful handling if SMTP disabled).
- Validate migration version state in the target environment.
