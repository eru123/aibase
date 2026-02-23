---
name: Generate Auth Token
description: Generate an authentication token (Bearer) for a user without password
---

# Generate Auth Token

This skill generates a valid authentication token (Bearer) for a specified user, bypassing the password login process.
Note: This application uses opaque session tokens stored in the database, not stateless JWTs. This tool creates a valid session entry.

## Prerequisites

- PHP installed
- Dependencies installed via `composer install`
- `.env` file configured with DB settings

## Usage

Run the `generate_auth_token.php` script:

```bash
php .antigravity/skills/generate_auth_token/generate_auth_token.php --user="jericho"
```

## Arguments

- `--user`: Username or Email of the user (required)
- `--expire`: Expiry in days (optional, default: 7)
- `--remember`: Set expiry to 30 days (optional flag)

## Output

Returns the raw token string which can be used in the `Authorization` header:
`Authorization: Bearer <TOKEN>`
