# Contributing to AI Base

Thanks for your interest in contributing to AI Base! Please follow these guidelines to keep contributions consistent and secure.

## Development Setup

1. Install dependencies:

   ```bash
   composer install
   pnpm install
   ```

2. Run migrations and seeds:

   ```bash
   vendor/bin/phinx migrate
   vendor/bin/phinx seed:run -s OtpMethodsSeeder
   ```

3. Start the dev servers:

   ```bash
   php -S localhost:8000 -t api
   pnpm dev
   ```

## Standards

- Keep user system and utilities in scope.
- Use the existing confirm modal for destructive actions.
- Add or update tests when changing business logic.
- Avoid introducing security regressions; prefer parameterized queries and validated input.

## Submitting Changes

1. Create a feature branch.
2. Commit with a clear message.
3. Open a pull request describing changes and tests run.
