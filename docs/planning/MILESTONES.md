# Milestones

This document groups the implementation into milestones that follow the real dependency chain of the `next-app/` codebase.

Important note:
- this is a planning document
- for the current implementation state, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`
- these milestones were revised to match the actual code and data dependencies

## Current Progress Snapshot

- Milestone 1: implemented
- Milestone 2: implemented, hardened, and documented
- Milestone 3: implemented and verified
- Milestone 4: implemented and verified for the current scope
- Milestone 5: implemented and verified for the strict scope
- Milestone 6: implemented and verified for the current scope
- Milestone 7: partially implemented
- Milestone 8: implemented and verified for the current scope
- Milestone 9: implemented and verified for the current scope
- Milestone 10: partially implemented
- Milestone 11: not implemented beyond route protection
- Milestone 12: not implemented

## Why The Milestones Were Reworked

The earlier milestone order assumed onboarding could require goals, habits, and tasks before those models existed. That was not a correct engineering sequence.

The revised milestone order fixes three dependency rules:
- local mode must become real persistence before we rely on it for onboarding and product data
- goals, habits, and tasks must exist before first-use setup can require them
- dashboard and weekly review must come after activity and completion data exist

## Milestone 1: Product and Technical Foundation

### Goal
Create the technical base required for all later work.

### Includes
- architecture and folder structure
- Next.js + TypeScript setup
- Prisma + PostgreSQL setup
- auth foundation
- storage abstraction interfaces
- design tokens and UI primitives
- CI, lint, format, test baseline

### Outcome
The project is ready for real implementation work.

## Milestone 2: Public Entry and Access Flows

### Goal
Let users discover the product and access it through local mode or cloud account mode.

### Includes
- landing page
- sign-up / sign-in
- Google sign-in
- password reset
- email verification
- local-mode access path
- route protection and session handling

### Current implementation note
This milestone is implemented in code.

### Outcome
Users can enter the app through public, local, and cloud account flows.

## Milestone 3: Local Persistence and Mode Integrity

### Goal
Turn local mode from a route-access shortcut into a real local-first product path.

### Includes
- IndexedDB adapter implementation
- local storage key strategy
- persistence helpers for local entities
- local-mode data hydration and save behavior
- storage abstraction usage in real feature flows
- migration contract definition for future cloud import

### Current implementation note
This milestone is now implemented for the real current data model: IndexedDB persists onboarding, planner, and weekly-review data, and local-mode protected surfaces use that persisted data directly.

### Why this comes now
The product promise includes local tracking. Before onboarding and product entities become real, local mode must have real persistence semantics instead of only a cookie boundary.

### Outcome
Local mode becomes a real bootstrap-capable data mode, not just a protected-route bypass.

## Milestone 4: Onboarding and Account Bootstrap

### Goal
Build the real onboarding questionnaire and preference capture flow.

### Includes
- onboarding questionnaire UI
- onboarding preference persistence
- profile/bootstrap defaults
- onboarding completion state
- redirect logic based on onboarding completion
- early hardening work such as auth rate limiting, security headers, and observability wiring

### Important scope boundary
This milestone does **not** yet force creation of goals, habits, or tasks. That must wait until those entities exist.

### Current implementation note
This milestone is implemented and verified for the current scope: onboarding and persistence paths exist, and the app enforces onboarding completion before cloud dashboard access.

### Outcome
The app can capture personalization and know whether a user has completed onboarding.

## Milestone 5: Core Planning Domain

### Goal
Implement the foundational planning entities users organize around.

### Includes
- categories CRUD
- dreams CRUD
- goals CRUD
- optional goal-to-dream linking
- ownership and validation rules
- cloud and local persistence support for these entities

### Outcome
Users can create and organize long-term and short-term planning structures.

## Milestone 6: Action Tracking Core

### Goal
Implement the action layer users perform daily.

### Includes
- habits CRUD
- recurrence rules
- habit completion records
- tasks CRUD
- task completion records
- optional goal linkage for habits and tasks
- cloud and local persistence for action history

### Outcome
Users can perform and record daily progress actions in both local and cloud modes.

## Milestone 7: Guided First-Use Setup

### Goal
Use the real domain models to drive a proper first-use setup experience.

### Includes
- require first goal creation
- require first habit or task creation
- first-use progress state
- transition from onboarding into real app usage
- first dashboard entry rules

### Current implementation note
This milestone is only partially complete. Onboarding completion and dashboard gating exist, but the app does not yet require a first goal or first action before considering setup meaningfully complete.

### Why this comes here
You cannot enforce first goal or first habit/task creation until goals, habits, and tasks are actually implemented.

### Outcome
New users reach a meaningful initial product state instead of landing in an empty workspace.

## Milestone 8: Dashboard, Activity, and Streaks

### Goal
Turn stored activity into visible motivation and direction.

### Includes
- real dashboard data loading
- activity timeline
- streak logic
- most-active or most-focused goal logic
- summary widgets and empty states

### Current implementation note
This milestone is implemented for the current scope. The dashboard now derives real summaries from stored completion history in both local and cloud mode.

### Outcome
The dashboard becomes a real product surface driven by user data.

## Milestone 9: Weekly Review and Reflection

### Goal
Help users review consistency, progress, and missed areas over time.

### Includes
- weekly review screen
- weekly summaries and wins/missed areas
- optional reflection/journal support
- weekly review persistence

### Current implementation note
This milestone is implemented for the current scope. Weekly review summaries and optional reflection persistence work in both local and cloud mode.

### Outcome
The app supports improvement loops, not just tracking.

## Milestone 10: Settings, Profile, Reminders, and Migration

### Goal
Complete the personal experience and connect local and cloud product paths properly.

### Includes
- profile editing
- avatar/profile image support
- theme settings and dark mode persistence
- reminder preferences
- reminder delivery basics
- local-to-cloud migration for real user data

### Current implementation note
This milestone is partially complete. The app now has a protected settings surface, editable profile basics, and local-to-cloud migration for the current real data model. Avatar support, theme persistence, and reminders are still open.

### Why migration belongs here
Migration cannot be finished correctly until the real product entities already exist in both local and cloud persistence layers.

### Outcome
Users can personalize the app and safely move from local mode to cloud mode.

## Milestone 11: Admin, Tester, and Product Oversight

### Goal
Add the tooling needed for controlled testing and product oversight.

### Includes
- admin dashboard
- user list
- test-account tools
- feature flags
- bug/report visibility
- analytics overview
- audit logging

### Outcome
The product becomes operable for testing, iteration, and controlled rollout.

## Milestone 12: Launch Hardening and MVP Release

### Goal
Prepare the MVP for external testers and early adopters.

### Includes
- responsive polish
- accessibility improvements
- stronger loading, error, and empty states
- monitoring and logging
- backup/recovery basics
- final regression pass
- deployment and release checklist

### Outcome
The MVP is stable enough to put in front of real users.
