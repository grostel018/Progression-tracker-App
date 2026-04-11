# Environment Variables

Last updated: 2026-04-04

This document lists the environment variables used by the current `next-app/` codebase.

## Required for local development

```env
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/progression_tracker
AUTH_SECRET=<long-random-secret>
REMINDER_DISPATCH_SECRET=<long-random-secret>
```

### `APP_URL`
Base URL used in emails, redirect links, reminder messages, and health reporting.

### `NEXTAUTH_URL`
Explicit auth callback base URL. Keep this set even in development to avoid environment drift.

### `DATABASE_URL`
Prisma/PostgreSQL connection string.

### `AUTH_SECRET`
Secret used by NextAuth for JWT and auth signing.

### `REMINDER_DISPATCH_SECRET`
Shared secret for `POST /api/internal/reminders/dispatch`.

## Auth and account access

### `GOOGLE_CLIENT_ID`
Optional. Enables Google sign-in when paired with `GOOGLE_CLIENT_SECRET`.

### `GOOGLE_CLIENT_SECRET`
Optional. Enables Google sign-in when paired with `GOOGLE_CLIENT_ID`.

## Email delivery

### `EMAIL_FROM`
Sender address for auth and reminder emails.

### `EMAIL_SERVER_HOST`
Optional SMTP host.

### `EMAIL_SERVER_PORT`
Optional SMTP port.

### `EMAIL_SERVER_USER`
Optional SMTP username.

### `EMAIL_SERVER_PASSWORD`
Optional SMTP password.

If SMTP is not configured, auth and reminder emails are written to `.tmp/outbox` in development.

## Storage

### `STORAGE_DRIVER`
Current values: `local` or `cloud`.

### `S3_BUCKET`
Bucket used for avatar storage when `STORAGE_DRIVER=cloud`.

### `S3_REGION`
Region used for avatar storage when `STORAGE_DRIVER=cloud`.

### `S3_ACCESS_KEY_ID`
Access key for avatar storage when `STORAGE_DRIVER=cloud`.

### `S3_SECRET_ACCESS_KEY`
Secret key for avatar storage when `STORAGE_DRIVER=cloud`.

## Reminders and scheduling

### `CRON_SECRET`
Optional Vercel cron secret. In Vercel deployments, set this to the same value as `REMINDER_DISPATCH_SECRET` so the hourly cron can authenticate through the Bearer token header.

## Analytics and observability

### `ANALYTICS_ENABLED`
Optional. Current values: `true` or `false`.

### `SENTRY_DSN`
Optional. Enables server-side Sentry reporting.

### `NEXT_PUBLIC_SENTRY_DSN`
Optional. Enables client-side Sentry reporting.

## Rate limiting

### `RATE_LIMIT_DRIVER`
Current values: `memory` or `upstash`.

### `UPSTASH_REDIS_REST_URL`
Required when `RATE_LIMIT_DRIVER=upstash`.

### `UPSTASH_REDIS_REST_TOKEN`
Required when `RATE_LIMIT_DRIVER=upstash`.

## Recommended local workflow

1. Copy `.env.example` to `.env`
2. Copy `.env.example` to `.env.local`
3. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and `REMINDER_DISPATCH_SECRET`
4. Keep `CRON_SECRET` blank locally unless you are explicitly testing Bearer-authenticated cron dispatch
5. Add Google, SMTP, S3, Sentry, or Upstash values only when you are actively testing those features
6. Run `npm run db:deploy` before starting the app on a fresh database
