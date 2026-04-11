# Operations Guide

Last updated: 2026-04-04

This document describes the minimum practical operations posture for the current MVP.

## Health endpoint

- Endpoint: `GET /api/health`
- Purpose: quick readiness signal for app, database, storage, reminder dispatch configuration, and Sentry wiring
- Expected use: load balancer checks, manual smoke checks, deployment verification

## Reminder dispatch

- Endpoint: `POST /api/internal/reminders/dispatch`
- Authentication:
  - `x-reminder-dispatch-secret: <REMINDER_DISPATCH_SECRET>`
  - or `Authorization: Bearer <REMINDER_DISPATCH_SECRET or CRON_SECRET>`
- Local/dev behavior: emails are written to `.tmp/outbox` when SMTP is not configured
- Delivery logging: every dispatch writes `ReminderDelivery` records with `SENT`, `SKIPPED`, or `FAILED`

## Scheduler setup

### Generic scheduler
Call `POST /api/internal/reminders/dispatch` hourly with `x-reminder-dispatch-secret`.

### Vercel cron
- `vercel.json` schedules the route hourly
- set `CRON_SECRET` and `REMINDER_DISPATCH_SECRET` to the same value
- Vercel will send the Bearer token automatically when `CRON_SECRET` is configured

## Database workflow

For fresh environments:

```bash
npm run db:generate
npm run db:deploy
```

The baseline migration lives in `prisma/migrations/20260404_milestone_7_12/`.

## CI expectations

GitHub Actions now validates:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

CI uses a PostgreSQL service container and applies Prisma migrations before running tests.

## Storage

- `STORAGE_DRIVER=local` stores avatar uploads under `public/uploads/avatars`
- `STORAGE_DRIVER=cloud` uses the S3-compatible env vars
- replacing an avatar deletes the previous asset reference

## Monitoring

- Sentry is wired for server and client use when DSNs are configured
- failed reminder dispatches capture exceptions to Sentry
- production alert routing still depends on deployment-side configuration
