# Architecture Decisions

Last updated: 2026-04-03

## ADR-001: Separate next-app workspace
The Next.js MVP foundation lives in `next-app/` so the existing PHP app can remain untouched while the new architecture is developed safely.

## ADR-002: Modular monolith
The MVP uses a modular monolith instead of microservices to reduce cost and complexity.

## ADR-003: PostgreSQL plus Prisma
The cloud-backed source of truth uses PostgreSQL with Prisma for maintainability and type-safe data access.

## ADR-004: Local/cloud persistence abstraction
Persistence is designed behind adapters so local mode and cloud mode can eventually share the same core entity model.

Important current note:
- the adapter layer exists
- local mode now has a real IndexedDB-backed workspace foundation
- full local entity persistence and migration are still future work

## ADR-005: Token-driven UI foundation
The UI foundation uses shared design tokens, utility-first styling, and reusable primitives instead of a large prebuilt design framework.

## ADR-006: Auth-first Milestone 2
Milestone 2 was implemented before product-domain features so route protection, account access, and recovery flows could stabilize first.

## ADR-007: Auth.js-compatible identity schema
The Prisma schema is aligned with NextAuth / Auth.js adapter expectations for users, OAuth accounts, sessions, and verification tokens.

## ADR-008: Lazy server env validation
Environment variables are validated through server-only helper functions instead of eager module-level parsing so lint, test, and build commands do not fail unless a runtime path actually needs the missing secret.

## ADR-009: JWT session strategy for current implementation
The current auth implementation uses NextAuth JWT session strategy even though Prisma still backs the identity layer.

Reason:
- simpler runtime behavior for the current milestone
- easier local iteration while access flows were still being stabilized

Tradeoff:
- if server-side session invalidation or richer admin auth controls become important later, revisit this decision explicitly

## ADR-010: Preview email fallback in development
When SMTP is not configured, auth emails are written to `.tmp/outbox` so verification and recovery flows can still be tested locally.

## ADR-011: Placeholder protected shells before real domain modules
`/dashboard`, `/onboarding`, and `/admin` currently exist as protected shells or placeholders so route protection and access UX can be validated before deeper domain work begins.

## ADR-012: Server Actions for domain mutations
Beginning with onboarding and all future product-domain work, mutations should use Next.js Server Actions by default.

Use Server Actions for:
- onboarding persistence
- future create/update/archive/check/complete flows for goals, habits, tasks, and related entities

Reserve route handlers for:
- NextAuth/auth routes
- webhooks
- health checks
- future public/export API endpoints

Reason:
- keeps mutations close to the UI that triggers them
- avoids building an unnecessary internal REST layer
- fits the current App Router modular monolith well

## ADR-013: Vercel-style hardening baseline
Even before full deployment work, platform hardening should assume a Vercel-style deployment path.

That means adding early:
- security headers in Next config
- Sentry wiring
- rate limiting around auth entry points
- explicit env var documentation

Reason:
- these concerns repeatedly get pushed too late if they are framed as launch-only work
- moving them earlier reduces rework and hidden deployment risk
