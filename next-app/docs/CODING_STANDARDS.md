# Coding Standards

## Goals

These standards exist to keep the new app maintainable, consistent, and affordable to evolve as a solo-engineer MVP.

## Core Rules

- Use TypeScript in strict mode.
- Keep code organized by feature first, not by technical layer alone.
- Keep business logic out of React components when possible.
- Prefer small explicit functions over clever abstractions.
- Use Zod for input validation and boundary validation.
- Use Prisma access only through shared database helpers or repositories.
- Keep presentation components reusable and side-effect free where practical.
- Use server boundaries intentionally for anything security-sensitive.

## UI Rules

- Build with mobile-first layouts.
- Use design tokens instead of hard-coded one-off styling values.
- Keep accessibility in mind for all interactive controls.
- Prefer composition over giant multi-purpose components.

## Data Rules

- Use CUID-based string IDs for cloud-compatible and local-compatible records.
- Keep local and cloud model shapes aligned.
- Separate record definitions from event/history records.
- Do not over-normalize early unless query complexity demands it.

## Testing Rules

- Add unit tests for domain logic and validation.
- Add integration tests for security-sensitive and persistence-sensitive flows.
- Keep end-to-end tests focused on critical user journeys.

## Scope Rules

- Do not build speculative platform features early.
- Do not add advanced infrastructure before there is a clear need.
- Do not mix Milestone 2+ product work into Milestone 1 foundation files.
