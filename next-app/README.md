# Progression Tracker Next App

This workspace contains the current Next.js application for Progression Tracker. The legacy PHP app in the parent folder is not part of this codebase.

## Current Status

The implementation now covers the milestone roadmap through launch hardening for the current MVP scope.

Implemented and verified now:
- Milestone 1 technical foundation
- Milestone 2 public entry, authentication, verification, recovery, and rate limiting
- Milestone 3 local persistence and mode integrity
- Milestone 4 onboarding and account bootstrap
- Milestone 5 planning domain for categories, dreams, and goals
- Milestone 6 action tracking for habits and tasks
- Milestone 7 guided first-use setup with a required first goal and first habit or task
- Milestone 8 dashboard activity and streak foundations
- Milestone 9 weekly review and reflection
- Milestone 10 settings, avatar support, theme persistence, reminder preferences and delivery, and local-to-cloud migration
- Milestone 11 admin and product-ops tooling with audit logging and safe support actions
- Milestone 12 launch hardening for the current scope, including health checks, CI coverage, CSP tightening, and expanded E2E coverage

## Feature Surface

Current production-oriented surfaces include:
- public landing, sign-up, sign-in, forgot-password, reset-password, and verify-email
- local mode entry with IndexedDB-backed onboarding, planner, dashboard, and weekly review data
- cloud mode with credentials auth and optional Google auth when env values are configured
- `/first-steps` gating after onboarding until a goal and a first action exist
- `/dashboard`, `/planner`, `/weekly-review`, `/settings`, and `/admin`
- planner sidebar navigation plus a goal review surface with manual progress logs, month-range activity, and linked proof from habits and tasks
- profile editing, avatar upload/remove, persistent theme selection, reminder preferences, and local-to-cloud import
- internal reminder dispatch endpoint at `/api/internal/reminders/dispatch`
- health endpoint at `/api/health`

## Setup

1. Copy `.env.example` to `.env`
2. Copy `.env.example` to `.env.local`
3. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and `REMINDER_DISPATCH_SECRET`
4. For Vercel cron, set `CRON_SECRET` to the same value as `REMINDER_DISPATCH_SECRET`
5. Install dependencies
6. Generate Prisma client
7. Apply migrations
8. Start the dev server

```bash
npm install
npx prisma validate
npm run db:generate
npm run db:deploy
npm run dev
```

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Deployment Notes

- `prisma/migrations/20260404_milestone_7_12/` is the baseline migration for a fresh database.
- `prisma/migrations/20260406_goal_log_progress_flow/` adds cloud goal progress logging for the merged planner review flow.
- `vercel.json` schedules the reminder dispatcher hourly.
- The reminder dispatch route accepts either `x-reminder-dispatch-secret` or `Authorization: Bearer ...`.
- If SMTP is not configured, auth and reminder emails fall back to `.tmp/outbox` in development.
- The health endpoint reports app, database, storage, reminder-dispatch, and Sentry readiness.

## Docs Map

Current code-aligned docs:
- `docs/CURRENT_IMPLEMENTATION_STATUS.md`
- `docs/SENIOR_ENGINEER_HANDOFF.md`
- `docs/CODEBASE_GAP_AUDIT.md`
- `docs/AUTH_SECURITY_CHECKLIST.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/env.md`
- `docs/OPERATIONS.md`

Planning docs outside this folder describe target-product history and are not the source of truth for current implementation in this workspace.
