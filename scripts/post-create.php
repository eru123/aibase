<?php

/**
 * Post-create-project instructions.
 * Displayed after `composer create-project eru123/opensys` completes.
 */

declare(strict_types=1);

echo <<<'MSG'

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀  OpenSys project created successfully!                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

  Getting Started:
  ────────────────

  1. Configure your environment:
     Edit the .env file with your database and branding settings.

  2. Run database migrations:
     pnpm db:migrate

  3. Start the development server:
     pnpm dev          → Starts both Frontend (Vite) & Backend (PHP)

  4. Open in your browser:
     Frontend: http://localhost:5173
     API:      http://localhost:8000

  Documentation:
     https://github.com/eru123/opensys

  Happy coding! 🎉

MSG;
