# Getting Started with AI Base

AI Base provides a user system with authentication and profile management.

## Install Dependencies

```bash
composer install
pnpm install
```

## Configure Environment

```bash
cp .env.example .env
```

Update `.env` with database and SMTP settings. AI Base ships with sensible defaults for local development.

## Initialize Database

```bash
mysql -u root -p -e "CREATE DATABASE aibase;"
vendor/bin/phinx migrate
```

## Run the App

```bash
php -S localhost:8000 -t api
pnpm dev
```

Open `http://localhost:5173` in your browser.
