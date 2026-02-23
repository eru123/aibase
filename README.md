# AI Base Starter Template

AI Base is a production-minded **starter template** for building internal platforms and SaaS control panels with a PHP 8.2+ API and a React + Vite + TypeScript frontend.

It gives you a strong foundation out of the box:
- Authentication + session management (login, refresh, logout, profile).
- Admin onboarding + invitation flows.
- System settings modules (security, SMTP, company).
- Email template management and send tooling.
- Audit logging and error logging primitives.
- A reusable Tailwind + Radix component system.

## Why this template exists

Most teams lose time rebuilding the same platform concerns (auth, settings, logs, admin UX) before shipping domain features. AI Base is designed to remove that friction while keeping architecture clean, explicit, and extensible.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Query, React Hook Form + Zod
- **Backend**: PHP 8.2+, PSR-4 service/controller/model structure
- **Database**: MySQL + Phinx migrations
- **Tooling**: ESLint, TypeScript checks, Composer, pnpm

## Starter Quick Start

### 1) Install dependencies

```bash
composer install
pnpm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Update `.env` as needed (database + app URLs + optional SMTP and branding values).

### 3) Create database and run migrations

```bash
mysql -u root -p -e "CREATE DATABASE aibase;"
pnpm db:migrate
```

### 4) Start development server

```bash
pnpm dev
```

`pnpm dev` starts Vite and automatically launches the PHP server used by the API.

### 5) Open the app

- Frontend: `http://localhost:5173`
- API base: http://localhost:8000/api

## Validation Commands

Run these before opening a PR:

```bash
pnpm lint
pnpm type-check
pnpm build
```

If backend logic changes, also run relevant PHP checks (for example, migration command sanity checks and endpoint smoke tests).

## Project Structure

```text
src/                # React pages, layouts, hooks, shared UI components
api/Controllers/    # HTTP endpoint orchestration
api/Services/       # Business logic and cross-cutting concerns
api/Models/         # Data persistence and query logic
db/migrations/      # Database schema history
docs/               # Setup, architecture, deployment, API docs
```

## Template Customization Checklist

When adapting this starter for your own product, do at least the following:

1. Update branding vars in `.env` (`VITE_APP_NAME`, company labels, etc.).
2. Review user roles/permissions in backend services and UI route gating.
3. Replace sample email template content with your product messaging.
4. Confirm SMTP and security settings defaults for your environment.
5. Add domain modules in `src/pages` + `api/Controllers|Services|Models` using current architecture boundaries.

## Documentation Index

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)
- [Caching Notes](docs/caching.md)
- [Email Service](docs/email-service.md)
- [Implementation Scope](docs/implementation-progress.md)

## License

Proprietary (see `composer.json`).
