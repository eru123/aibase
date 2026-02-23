<?php

/**
 * Ensures pnpm is available, attempting corepack or npm fallbacks if needed.
 * Used by Composer lifecycle hooks.
 */

declare(strict_types=1);

$isWindows = PHP_OS_FAMILY === 'Windows';
$null = $isWindows ? 'NUL' : '/dev/null';

function commandExists(string $command, string $null): bool
{
    $check = PHP_OS_FAMILY === 'Windows'
        ? "where $command >$null 2>&1"
        : "command -v $command >$null 2>&1";
    return proc_close(proc_open($check, [STDIN, STDOUT, STDERR], $pipes)) === 0;
}

// 1. Already installed
if (commandExists('pnpm', $null)) {
    echo "✓ pnpm is already available.\n";
    exit(0);
}

echo "⚠ pnpm not found. Attempting to install...\n";

// 2. Try corepack (ships with Node >= 16.9)
if (commandExists('corepack', $null)) {
    echo "→ Enabling pnpm via corepack...\n";
    passthru('corepack enable pnpm', $code);
    if ($code === 0 && commandExists('pnpm', $null)) {
        echo "✓ pnpm enabled via corepack.\n";
        exit(0);
    }
    echo "  corepack enable did not succeed, trying next method...\n";
}

// 3. Try npm global install
if (commandExists('npm', $null)) {
    echo "→ Installing pnpm via npm...\n";
    passthru('npm install -g pnpm', $code);
    if ($code === 0) {
        echo "✓ pnpm installed via npm.\n";
        exit(0);
    }
    echo "  npm install -g pnpm failed.\n";
}

// 4. Nothing worked
echo <<<'MSG'

✗ Could not install pnpm automatically.

Please install pnpm manually:
  https://pnpm.io/installation

Then run:
  pnpm install

MSG;

exit(1);
