# Auth and Security Checklist

Last updated: 2026-04-04

This checklist reflects the current `next-app/` implementation.

## Session Strategy

Current implementation:
- NextAuth uses JWT session strategy
- Prisma still backs users, OAuth accounts, compatibility session tables, and verification tokens
- middleware uses `next-auth/jwt` token inspection to protect routes
- server-side access helpers live under `src/lib/auth/`

## Password Hashing

Current implementation:
- passwords are hashed with `bcryptjs`
- password verification is server-side only
- credential accounts require verified email before sign-in succeeds

## Verification and recovery

Implemented now:
- email verification links and manual codes
- resend verification behavior
- verification attempt throttling
- forgot-password and reset-password
- create-password flow for Google-first accounts
- generic privacy-preserving password reset responses

## OAuth account linking

Implemented now:
- Google sign-in only when env values are configured
- Google sign-in only for verified provider emails
- suspended users are blocked from re-entering through Google sync

## Protected boundaries

Implemented now:
- `/dashboard`, `/onboarding`, `/first-steps`, `/planner`, `/weekly-review`, and `/settings` require local mode or cloud session
- `/admin` requires cloud `ADMIN`
- local mode never unlocks admin access
- weekly review and settings are protected in middleware and at the page boundary

## Local mode boundaries

Implemented now:
- local mode is not just a cookie shell anymore
- IndexedDB backs onboarding, planner entities, completion history, and weekly reviews
- cloud auth wins over stale local-mode cookies
- local-to-cloud migration is allowed only into an empty cloud workspace

## Reminder and admin security

Implemented now:
- reminder dispatch requires `x-reminder-dispatch-secret` or `Authorization: Bearer ...`
- admin support actions are restricted to `ADMIN`
- admin actions create audit log entries
- avatar uploads validate file type, signature, and size

## Remaining security follow-ups

These are future hardening opportunities, not missing milestone work:
- structured security-event alert routing outside the repo
- session revocation strategy beyond JWT defaults
- broader external penetration-style review before public launch
