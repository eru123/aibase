# Starter Template Scope

AI Base is now positioned as a reusable starter template. Current baseline capabilities include:

- Auth lifecycle: register, login, refresh, logout, forgot/reset password, email verification.
- Admin bootstrap and invitation-based user onboarding.
- Role-aware access control with protected admin endpoints.
- User profile management and password update flows.
- User approval/rejection workflows.
- System settings modules (security, SMTP, company) with public settings endpoint.
- Email template CRUD with preview and outbound send endpoints.
- Operational visibility via audit logs, authentication logs, and error logs.
- Upload endpoints and shared utility services (cache, audit context, auth support).

## Intended usage

Use this baseline to build domain modules quickly while keeping architecture boundaries intact:

- **Controllers** for route orchestration.
- **Services** for business rules.
- **Models** for persistence.
- **Frontend hooks/pages/components** for typed and reusable UX composition.
