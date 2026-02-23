# API Reference (Starter Baseline)

Base URL (local): `/api`

This is the baseline contract shipped with the starter template.

## Authentication (`/api/auth`)

Public:
- `GET /admin-count`
- `POST /setup-admin`
- `POST /register`
- `POST /verify-signup`
- `POST /login`
- `POST /refresh`
- `GET /invitation`
- `POST /accept-invitation`
- `GET /verify-email`
- `POST /forgot-password`
- `POST /reset-password`

Authenticated:
- `POST /logout`
- `GET /me`

Admin:
- `POST /invite`

## System settings (`/api/system-settings`)

Public:
- `GET /public`

Admin:
- `GET /security`
- `PUT /security`
- `PUT /company`
- `GET /smtp`
- `PUT /smtp`
- `POST /smtp/test`

## Email templates (`/api/email-templates`) — Admin

- `GET /`
- `POST /`
- `GET /{id}`
- `PUT /{id}`
- `DELETE /{id}`
- `POST /{id}/preview`

## Emails (`/api/emails`) — Admin

- `POST /send-template`
- `POST /send-raw`

## Uploads (`/api/uploads`) — Authenticated

- `GET /`
- `POST /`
- `GET /{id}`
- `PUT /{id}`
- `DELETE /{id}`

## Profile (`/api/profile`) — Authenticated

- `GET /`
- `PUT /`
- `PUT /password`

## Public user profile

- `GET /api/u/{username}`

## Users (`/api/users`) — Admin

- `GET /`
- `PUT /{id}`
- `POST /{id}/approve`
- `POST /{id}/reject`

## Audit logs (`/api/audit-logs`) — Admin

- `GET /`
- `GET /{id}`

## Authentication logs (`/api/authentication-logs`) — Authenticated

- `GET /`

## Error logs (`/api/error-logs`) — Admin

- `GET /`
- `GET /{id}`
- `DELETE /{id}`

## Notes

- Unknown API routes return a standard 404 error payload.
- Keep frontend data consumers aligned when changing response structures.
