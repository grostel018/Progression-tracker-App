# Current Implementation Status

Last updated: 2026-04-06

This document describes the current state of the `next-app/` codebase as it exists today.

## Milestone Summary

- Milestone 1: implemented and verified
- Milestone 2: implemented, hardened, and verified
- Milestone 3: implemented and verified
- Milestone 4: implemented and verified
- Milestone 5: implemented and verified
- Milestone 6: implemented and verified
- Milestone 7: implemented and verified
- Milestone 8: implemented and verified
- Milestone 9: implemented and verified
- Milestone 10: implemented and verified for the current MVP scope
- Milestone 11: implemented and verified for the current MVP scope
- Milestone 12: implemented and verified for the current MVP scope

## What Exists Now

### Access and onboarding
- landing, sign-up, sign-in, forgot-password, reset-password, and verify-email
- credentials auth and optional Google auth
- auth rate limiting with `memory` and `upstash` drivers
- local mode entry and local/cloud mode conflict protection
- onboarding in both local and cloud mode
- `/first-steps` gating until a user has one goal and one first habit or task

### Product surfaces
- `/dashboard` with recent activity, streaks, and goal momentum
- `/planner` with categories, dreams, goals, a planner sidebar, manual goal progress review, habits, tasks, archives, and completion history
- `/weekly-review` with summaries, reflection, and persistence in both local and cloud mode
- `/settings` with profile editing, avatar upload/remove, theme persistence, reminder preferences, and migration
- `/admin` with metrics, searchable user visibility, per-user detail, and safe audited support actions

### Persistence and operations
- Prisma schema plus baseline migration for the full current data model
- IndexedDB persistence for local onboarding, planning, goal logs, activity, and weekly review data
- local-to-cloud migration when the cloud workspace is still empty
- reminder delivery logging and email dispatch foundation
- health endpoint at `/api/health`
- reminder dispatch endpoint at `/api/internal/reminders/dispatch`
- hourly scheduler config in `vercel.json`
- CI coverage for lint, typecheck, unit tests, build, and Playwright E2E

## Current Database Reality

Implemented Prisma models now include:
- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Profile`
- `OnboardingPreference`
- `Category`
- `Dream`
- `Goal`
- `GoalLog`
- `Habit`
- `HabitCompletion`
- `Task`
- `TaskCompletion`
- `WeeklyReview`
- `ReminderPreference`
- `ReminderDelivery`
- `AdminAuditLog`

## Current Verification Surface

Validated locally with:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## Remaining Follow-Ups

The major milestone work is complete for the current MVP scope.

Reasonable future follow-ups are now optional expansion work rather than milestone blockers:
- richer analytics and experiment tooling
- non-email reminder channels
- deeper dashboard and planner analytics
- broader production monitoring and alert routing
