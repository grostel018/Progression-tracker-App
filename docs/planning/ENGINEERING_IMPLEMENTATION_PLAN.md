# Engineering Implementation Plan

This document defines a realistic engineering implementation plan for the next-generation version of Progression Tracker. It breaks the app into milestones with dependencies, execution tasks, likely file impact, risks, testing needs, and done criteria.

Important note:
- this remains a target-state implementation plan
- for the current implementation state, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`
- for current gaps before the next milestone, see `../../next-app/docs/CODEBASE_GAP_AUDIT.md`

## Planning Assumptions

This implementation plan assumes:
- the new version is being built in `next-app/`, separate from the existing PHP codebase
- the stack remains Next.js, TypeScript, PostgreSQL, Prisma, and a local/cloud persistence abstraction
- the product keeps local mode as a real part of the MVP promise
- one primary developer is doing the implementation

## Current Progress Snapshot

Implemented:
- Milestone 1 foundation
- Milestone 2 public entry and authentication
- targeted auth and access test coverage

Not yet implemented:
- real local persistence
- real onboarding
- product-domain entities
- first-use setup
- real dashboard data
- review, reminders, migration, admin tools, and launch hardening

## Why The Plan Was Reworked

The earlier order placed onboarding before the underlying goal, habit, and task models existed. It also treated local mode as if it were already a real persistence mode, when today it is mostly an access-path behavior.

The revised plan fixes that by:
- making real local persistence Milestone 3
- separating onboarding preference capture from first-use entity creation
- moving guided first-use setup until after real domain entities exist
- moving local-to-cloud migration until the real entities exist on both sides

## Corrected Milestone Order Summary

1. Foundation and project setup
2. Public entry and authentication
3. Local persistence and mode integrity
4. Onboarding and account bootstrap
5. Core planning domain
6. Action tracking core
7. Guided first-use setup
8. Dashboard, activity, and streaks
9. Weekly review and reflection
10. Settings, reminders, profile, and migration
11. Admin and product oversight
12. Launch hardening and release preparation

---

## Milestone 1: Foundation and Project Setup

### Goal
Establish the technical foundation, repo structure, design system baseline, database setup, and coding workflow needed for all later implementation.

### Dependencies
- none

### Tasks
- initialize the new application project
- set up TypeScript, linting, formatting, and environment handling
- create the top-level folder structure
- configure Prisma and initial PostgreSQL connection
- define shared types and validation conventions
- create design tokens and base UI components
- define storage abstraction for local mode and cloud mode
- set up testing framework and initial CI checks

### Files likely affected
- `package.json`
- `tsconfig.json`
- `next.config.*`
- `.env.example`
- `prisma/schema.prisma`
- `src/app/*`
- `src/components/ui/*`
- `src/lib/db/*`
- `src/lib/storage/*`
- `src/styles/*`
- CI config files

### Risks
- overengineering the initial abstractions
- spending too much time on setup before visible progress

### Testing needs
- CI baseline
- lint, typecheck, smoke test, build
- database connection validation

### Done criteria
- project boots successfully
- database tooling is wired
- shared structure exists
- design system foundation exists
- development workflow is repeatable

---

## Milestone 2: Public Entry and Authentication

### Goal
Enable users to discover the product and access it through local mode or cloud account mode.

### Dependencies
- Milestone 1

### Tasks
- build landing page and public entry flow
- implement local-mode entry path
- implement email/password registration and login
- implement Google sign-in
- implement password reset
- implement email verification
- protect authenticated routes
- define session handling

### Files likely affected
- `src/app/(marketing)/*`
- `src/app/(auth)/*`
- `src/app/api/auth/*`
- `src/features/auth/*`
- `src/lib/auth/*`
- `src/middleware.ts`
- auth-related Prisma models

### Risks
- auth complexity expanding too early
- OAuth configuration instability
- weak auth test coverage allowing regressions

### Testing needs
- validator tests
- auth service tests
- route access tests
- regression coverage for sign-up, verification, recovery, and Google-edge behavior

### Done criteria
- user can enter local mode
- user can register and log in with credentials
- user can log in with Google when configured
- password reset works
- email verification works
- public and protected routes behave correctly

---

## Milestone 3: Local Persistence and Mode Integrity

### Goal
Turn local mode into a real persistence mode instead of only a route-access mode.

### Dependencies
- Milestone 2

### Tasks
- implement the IndexedDB adapter
- define local entity storage conventions
- add local read/write/hydration helpers for product entities
- wire local-mode persistence into real feature flows
- define migration payload rules for future cloud import
- make local-mode UI states reflect real saved data

### Files likely affected
- `src/lib/storage/*`
- `src/features/*` for any entity persistence hooks/services introduced
- local-mode related route and session helpers
- possibly shared entity mappers/types

### Risks
- overengineering sync behavior too early
- drifting local data shape away from cloud entity shape
- building a migration system before the entity set is stable

### Testing needs
- local adapter tests
- storage contract tests
- local hydration tests
- local-mode regression tests

### Done criteria
- local mode persists data locally in a real storage layer
- product features can read/write local records
- local mode is no longer just a cookie-based protected route shortcut

---

## Milestone 4: Onboarding and Account Bootstrap

### Goal
Capture onboarding preferences and bootstrap account state without yet forcing domain-entity creation.

### Dependencies
- Milestone 3

### Tasks
- build onboarding questionnaire flow
- persist onboarding preferences
- define onboarding completion status
- add redirect logic based on onboarding completion
- connect profile/onboarding bootstrap defaults

### Files likely affected
- `src/app/(app)/onboarding/*`
- `src/features/onboarding/*`
- `src/features/profiles/*`
- onboarding/profile-related Prisma models already present

### Risks
- onboarding becoming too long
- mixing onboarding preferences with product-domain setup too early

### Testing needs
- onboarding validation tests
- onboarding completion-state tests
- local and cloud onboarding persistence tests

### Done criteria
- onboarding questions are real
- onboarding state persists in local and cloud modes
- app can determine whether a user has completed onboarding

---

## Milestone 5: Core Planning Domain

### Goal
Implement the planning entities users organize around.

### Dependencies
- Milestone 4

### Tasks
- implement categories CRUD
- implement dreams CRUD
- implement goals CRUD
- support optional goal-to-dream linking
- add ownership and validation rules
- support local and cloud persistence for these entities

### Files likely affected
- `src/features/categories/*`
- `src/features/dreams/*`
- `src/features/goals/*`
- related route files
- related Prisma models

### Risks
- unclear relationship rules between goals and dreams
- local/cloud parity drift

### Testing needs
- CRUD integration tests
- ownership tests
- optional relationship tests
- local/cloud persistence parity tests

### Done criteria
- users can manage categories, dreams, and goals
- goals may exist without dreams
- dreams may exist without goals
- these entities work in local and cloud modes

---

## Milestone 6: Action Tracking Core

### Goal
Implement the daily action layer through habits, tasks, and completion history.

### Dependencies
- Milestone 5

### Tasks
- implement habits CRUD
- implement recurrence rules
- implement habit completions
- implement tasks CRUD
- implement task completions
- support optional goal linkage
- support local and cloud persistence for definitions and history

### Files likely affected
- `src/features/habits/*`
- `src/features/tasks/*`
- activity/completion-related files
- related route files
- related Prisma models

### Risks
- mixing entity definitions with completion history incorrectly
- making recurrence logic too complex too early

### Testing needs
- recurrence logic tests
- completion recording tests
- goal linkage tests
- local/cloud parity tests

### Done criteria
- users can create and track habits and tasks
- completion history persists correctly
- entities work in both local and cloud modes

---

## Milestone 7: Guided First-Use Setup

### Goal
Use the real domain entities to drive a complete first-use setup experience.

### Dependencies
- Milestone 5
- Milestone 6

### Tasks
- require first goal creation
- require first habit or task creation
- track first-use setup progress
- route new users through setup before normal dashboard entry
- add helpful empty-state and completion transitions

### Files likely affected
- `src/app/(app)/onboarding/*`
- `src/features/onboarding/*`
- `src/features/goals/*`
- `src/features/habits/*`
- `src/features/tasks/*`

### Risks
- setup feeling too heavy
- edge cases between local and cloud onboarding state

### Testing needs
- first-use setup integration tests
- state transition tests
- local/cloud first-use flow tests

### Done criteria
- new users are guided into a meaningful initial product state
- dashboard is reached only after the required first setup is satisfied

---

## Milestone 8: Dashboard, Activity, and Streaks

### Goal
Turn user data into visible motivation and momentum.

### Dependencies
- Milestone 6
- Milestone 7

### Tasks
- connect dashboard to real data
- implement activity timeline
- implement streak logic
- implement most-active/most-focused goal logic
- add summary widgets and real empty states

### Files likely affected
- `src/app/(app)/dashboard/*`
- `src/features/activity/*`
- `src/features/streaks/*`
- related goal/habit/task query layers

### Risks
- expensive queries if event structure is weak
- inconsistent streak rules

### Testing needs
- streak unit tests
- dashboard data loader tests
- activity summary tests

### Done criteria
- dashboard becomes a real product surface driven by user data

---

## Milestone 9: Weekly Review and Reflection

### Goal
Support a recurring review loop that helps users improve over time.

### Dependencies
- Milestone 8

### Tasks
- build weekly review screen
- aggregate weekly activity and consistency
- surface wins and missed areas
- add optional reflection/journal support
- persist weekly review results

### Files likely affected
- `src/app/(app)/weekly-review/*`
- `src/features/weekly-review/*`
- activity/reflection-related files
- related Prisma models

### Risks
- review logic becoming analytics-heavy too early

### Testing needs
- weekly aggregation tests
- reflection persistence tests
- review flow integration tests

### Done criteria
- weekly review is real and usable

---

## Milestone 10: Settings, Reminders, Profile, and Migration

### Goal
Complete the personal experience and make local and cloud product paths converge properly.

### Dependencies
- Milestone 3
- Milestone 4
- Milestone 5
- Milestone 6

### Tasks
- implement profile editing
- implement avatar/profile image support
- implement theme settings and persistence
- implement reminder preferences
- implement reminder delivery basics
- implement local-to-cloud migration for real entity data

### Files likely affected
- `src/app/(app)/profile/*`
- `src/app/(app)/settings/*`
- `src/features/profiles/*`
- `src/features/notifications/*`
- `src/lib/storage/*`
- migration-related application logic
- related Prisma models

### Risks
- migration edge cases with partial local data
- reminder infrastructure growing too large
- file-upload complexity

### Testing needs
- settings/profile tests
- reminder preference tests
- migration flow tests
- file upload validation tests

### Done criteria
- users can manage profile and preferences
- local-to-cloud migration works for real product data

---

## Milestone 11: Admin and Product Oversight

### Goal
Add the tools needed for testing, product oversight, and controlled rollout.

### Dependencies
- Milestone 10

### Tasks
- build admin dashboard
- implement user list visibility
- implement bug/report visibility
- implement feature flags
- implement analytics overview
- add audit logging for important admin actions

### Files likely affected
- `src/app/admin/*`
- `src/features/admin/*`
- analytics/flags/report-related modules
- related Prisma models

### Risks
- admin tooling expanding too much before launch
- access-control mistakes

### Testing needs
- role and permission tests
- admin route tests
- audit log tests

### Done criteria
- admin tools are functional and properly protected

---

## Milestone 12: Launch Hardening and Release Preparation

### Goal
Prepare the MVP for external testers and early adopters.

### Dependencies
- Milestone 11

### Tasks
- responsive polish
- accessibility improvements
- loading/error/empty-state hardening
- deployment configuration
- monitoring and backup basics
- final regression pass

### Files likely affected
- cross-cutting UI files
- deployment and env config
- monitoring/logging setup
- documentation

### Risks
- hidden integration issues appearing late
- polish consuming too much time

### Testing needs
- end-to-end core user journeys
- responsive QA
- regression pass across auth, onboarding, tracking, dashboard, and review

### Done criteria
- MVP is deployable and stable enough for real users

## Dependency Summary

- Milestone 1 is the base for everything
- Milestone 2 depends on Milestone 1
- Milestone 3 depends on Milestone 2
- Milestone 4 depends on Milestone 3
- Milestone 5 depends on Milestone 4
- Milestone 6 depends on Milestone 5
- Milestone 7 depends on Milestone 5 and Milestone 6
- Milestone 8 depends on Milestone 6 and Milestone 7
- Milestone 9 depends on Milestone 8
- Milestone 10 depends on Milestone 3, 4, 5, and 6
- Milestone 11 depends on Milestone 10
- Milestone 12 depends on Milestone 11

## Recommended Execution Strategy

The safest solo-engineer strategy is:
- keep milestones dependency-correct
- finish one layer before forcing the next one to rely on it
- keep local and cloud behavior aligned as soon as real domain features start
- avoid pretending placeholder shells are completed product modules

## Final Guidance

The goal is no longer just to have a milestone list. The goal is to have a milestone sequence that matches the real engineering constraints of the codebase.

That is what this revised plan is meant to do.
