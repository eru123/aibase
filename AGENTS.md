# AGENTS.md — General Agent Operating Guide for AI Base

## Mission
Build and maintain AI Base as a secure, high-performance, low-friction platform with:
- **Backend rigor (PHP 8.2+)**: explicit validation, predictable APIs, and safe data access.
- **Frontend precision (React + Vite + TypeScript + Tailwind)**: type-safe state, elegant UX, and fast interactions.
- **Operational discipline**: every change should be reviewable, testable, and production-conscious.

Think and execute with:
Think and execute with:
- **Pragmatism**: Prioritize performance and simplicity over overly complex or clever solutions.
- **Intentional Design**: Aim for minimal, intentional UI with strong, user-friendly defaults.
- **Code Hygiene**: Maintain clean code paths, remove dead files, and ensure clear ownership.

---

## 1) Project Reality Snapshot

### Core stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Radix UI, React Query, React Hook Form + Zod.
- **Backend**: PHP API (PSR-4 under `api/`), service/controller/model layering.
- **Database**: MySQL with Phinx migrations in `db/migrations`.
- **Tooling**: ESLint, TypeScript compiler checks, PHPUnit config present.

### Important paths
- `src/` — frontend pages, layouts, hooks, reusable UI components.
- `api/Controllers` — request handling + route-level orchestration.
- `api/Services` — business logic and cross-cutting concerns.
- `api/Models` — database interaction abstractions.
- `db/migrations` — schema history and data model evolution.
- `docs/` — architecture and operational documentation.

---

## 2) Non-Negotiable Engineering Principles

1. **Correctness before convenience**
   - Keep API contracts explicit and stable.
   - Do not infer critical behavior from implicit assumptions.

2. **Performance as a feature**
   - Avoid unnecessary re-renders, N+1 query patterns, and redundant network calls.
   - Prefer bounded payloads, pagination, server-side filtering/sorting when appropriate.

3. **Memory and complexity discipline**
   - Keep component and service responsibilities tight.
   - Prefer composable helpers over giant multi-purpose functions.

4. **Security-first posture**
   - Validate inputs server-side even when frontend validates.
   - Keep auth, token, rate limiting, and audit flows intact.
   - Use parameterized query patterns and never trust user input.

5. **UX quality bar**
   - Tailwind utility use must stay clean and purposeful.
   - Favor existing shared UI primitives in `src/components/ui/*`.
   - Preserve accessibility semantics and clear error/loading states.

6. **No messy kitchen policy**
   - No duplicate logic when existing utilities exist.
   - No stale TODOs without context.
   - No orphaned files, dead imports, or unexplained magic numbers.

---

## 3) Agent Workflow (Default)

1. **Understand first**
   - Read nearby code and docs before editing.
   - Trace data flow from UI ↔ API ↔ DB for impacted areas.

2. **Plan small, execute clean**
   - Break work into atomic steps.
   - Make minimal, high-signal changes.

3. **Respect architecture boundaries**
   - Controllers coordinate; services encapsulate business rules; models persist.
   - Frontend pages orchestrate; hooks manage data/state concerns; UI components stay reusable.

4. **Validate aggressively**
   - Run focused checks first, then broader checks if impact widens.
   - Verify both happy paths and obvious failure paths.

5. **Document intent**
   - Update docs when behavior, workflow, or contracts change.
   - Keep commit and PR messages explicit: what changed, why, risk, and verification.

---

## 4) Backend Guidance (PHP 8.2+)

- Keep controllers lean; move branching business logic into services.
- Enforce strong request validation and return consistent response shapes.
- Maintain clear authz checks for role-sensitive endpoints.
- Prefer explicit DTO-like arrays/structures over loosely shaped payload mutation.
- When touching migrations:
  - Make them reversible where possible.
  - Avoid destructive operations without clear mitigation.
  - Consider production migration safety (locking/time/cost).

---

## 5) Frontend Guidance (React/TypeScript/Tailwind)

- Prefer strict typing; avoid `any` unless unavoidable and documented.
- Reuse shared hooks and utility functions before introducing new abstractions.
- Use React Query patterns consistently for async data and cache invalidation.
- Keep forms type-safe and validated (React Hook Form + Zod when applicable).
- Tailwind styling rules:
  - Favor readability and consistency over one-off utility explosions.
  - Keep visual hierarchy minimal and intentional.
  - Reuse existing component variants instead of ad hoc button/input styles.

---

## 6) API Contract & State Synchronization Rules

- Any backend response shape change requires frontend audit for impacted consumers.
- Keep naming aligned across backend and frontend (`snake_case`/`camelCase` mapping must be explicitly handled via transformers or documented conventions).
- Preserve backward compatibility unless task explicitly permits breaking change.
- For mutations, ensure cache invalidation/refetch logic is handled deliberately.

---

## 7) Quality Gates Before Merge

At minimum, run what is relevant:
- `pnpm lint`
- `pnpm type-check`
- `pnpm build` (for integration-level frontend confidence)
- targeted PHP checks/tests where backend logic changed
- migration dry reasoning (and local run if schema changed)

If any check cannot run, document exactly why and what was used as fallback verification.

---

## 8) Pull Request Expectations

Every PR should include:
1. **Problem statement** (what user/business issue exists)
2. **Solution summary** (what changed and architectural impact)
3. **Risk assessment** (auth, data, compatibility, performance)
4. **Validation evidence** (commands run + outcomes)
5. **Follow-ups** (intentional deferred work, if any)

Keep PRs scoped and review-friendly. Large refactors must be justified with measurable gains.

---

## 9) Anti-Patterns to Avoid

- Massive components/controllers/services doing too many jobs.
- Hidden side effects and mutation-heavy code flows.
- Divergent endpoint behavior for similar resources.
- UI inconsistency caused by bypassing shared design primitives.
- Adding dependencies when existing stack already solves the problem.

---

## 10) Definition of Done

A task is done when:
- behavior is correct,
- code is clean and maintainable,
- contracts are preserved (or explicitly versioned/communicated),
- relevant checks pass,
- docs are updated where needed,
- and another engineer can understand the change quickly.

Ship code that is fast, clear, and hard to break.
