---
name: Execute SQL
description: Execute raw SQL queries against the database
---

# Execute SQL

This skill allows you to execute raw SQL queries against the project's database.

## Prerequisites

- PHP installed
- Dependencies installed via `composer install` (specifically `vlucas/phpdotenv` and `pdo` extension)
- `.env` file configured with DB settings

## Usage

Run the `execute_sql.php` script:

```bash
php .antigravity/skills/execute_sql/execute_sql.php --query="SELECT * FROM users LIMIT 5"
```

## Arguments

- `--query`: The SQL query to execute (required). Wrap in quotes.
- `--json`: Output results in JSON format (optional).

## Output

- For SELECT/SHOW queries: Returns the result set (default: tab-separated text, or JSON if flag provided).
- For INSERT/UPDATE/DELETE: Returns success message and row count.
