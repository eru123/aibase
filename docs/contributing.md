# Contributing to OpenSys Starter Template

Thanks for contributing. Keep changes reviewable, secure, and production-conscious.

## Local development flow

1. Install dependencies (pnpm is installed automatically):

   ```bash
   composer install
   ```

2. Configure environment (`.env` is auto-created on `composer create-project`, copy manually if cloned):

   ```bash
   cp .env.example .env
   ```

3. Run migrations:

   ```bash
   pnpm db:migrate
   ```

4. Run dev server (starts both Vite frontend and PHP backend):

   ```bash
   pnpm dev
   ```

## Engineering expectations

- Keep controller/service/model boundaries clean.
- Reuse existing shared UI primitives and hooks.
- Preserve API response contract compatibility unless intentionally versioned.
- Validate server-side input and keep authz rules explicit.
- Avoid dead code, duplicate logic, and unclear magic values.

## Required checks before PR

```bash
pnpm lint
pnpm type-check
pnpm build
```

If backend logic is changed, run targeted backend verification and include command output in the PR notes.

## Pull request quality bar

Each PR should include:

1. Problem statement
2. Solution summary
3. Risk assessment (security, data, compatibility, performance)
4. Validation evidence (commands + outcomes)
5. Follow-ups (if intentionally deferred)
