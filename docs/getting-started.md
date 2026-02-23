# Getting Started (Starter Template)

This guide gets AI Base running as a reusable starter template for local development.

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 20+ (pnpm will be auto-installed via corepack or npm if not present)
- MySQL 8+

## 1) Create project

```bash
composer create-project eru123/opensys my-app -s dev
cd my-app
```

This automatically installs Composer and pnpm dependencies, and creates your `.env` file.

> **Already cloned the repo?** Just run `composer install` — it also triggers `pnpm install` automatically.

## 2) Configure environment

```bash
cp .env.example .env
```

Minimum settings to verify:

- `VITE_API_URL` (default local API URL)
- `VITE_APP_URL` (default local frontend URL)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`

Optional but recommended:

- SMTP: Configure via the System Settings admin panel after first login
- Branding settings (`VITE_APP_NAME`, `VITE_APP_SHORT_NAME`, etc.)

## 3) Initialize database

Create database:

```bash
mysql -u root -p -e "CREATE DATABASE opensys;"
```

Run migrations:

```bash
pnpm db:migrate
```

## 4) Run locally

```bash
pnpm dev
```

`pnpm dev` starts both the Vite frontend and the PHP backend server.

- Frontend: `http://localhost:5173`
- API: `http://127.0.0.1:8000/api`

## 5) Build confidence checks

```bash
pnpm lint
pnpm type-check
pnpm build
```

## 6) Starter-template adaptation

Before building domain features, align these template defaults:

1. Branding labels and app names in `.env`.
2. Default admin onboarding flow and approval rules.
3. SMTP settings via the System Settings admin panel.
4. Security settings defaults (session length, lockout behavior, etc.).
