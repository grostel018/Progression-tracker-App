# Implementation Backlog

This backlog is prioritized to match the corrected milestone order and the real engineering dependencies in `next-app`.

Important note:
- this is still a planning backlog
- for current implementation state, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`
- Milestone 1 and Milestone 2 are already implemented in code

## Priority 0: Foundation and Access Hardening

### BL-001: Project setup and engineering baseline
**User story**
As a developer, I want a clean project foundation so the app can be built consistently and safely.

**Acceptance criteria**
- repository contains agreed architecture and folder structure
- environment config strategy is defined
- linting, formatting, CI, and build checks are configured
- developer setup instructions exist

### BL-002: Design system foundation
**User story**
As a user, I want the app to feel polished and consistent so it is enjoyable and easy to use.

**Acceptance criteria**
- base design tokens are defined
- dark mode and light mode are supported
- reusable UI primitives are available
- mobile-first responsive patterns are established

### BL-003: Auth and route-access reliability
**User story**
As a developer, I want the auth and access layer covered by focused tests so future product work does not keep breaking it.

**Acceptance criteria**
- auth validation tests exist
- auth service tests exist
- route access tests exist
- lint, typecheck, test, and build all pass

## Priority 1: Public Entry and Authentication

### BL-004: Marketing landing page
**User story**
As a visitor, I want to understand the app quickly so I know whether it is useful.

**Acceptance criteria**
- landing page explains the app clearly
- page includes actions for local mode, sign-up, and sign-in
- page works well on mobile and desktop
- visuals feel modern and polished

### BL-005: Local mode entry flow
**User story**
As a new user, I want to enter the app without creating an account so I can try it immediately.

**Acceptance criteria**
- user can enter local mode
- route access works in local mode
- local-mode limitations are communicated clearly

### BL-006: Email/password registration and login
**User story**
As a user, I want to create an account and sign in securely so I can access my data across devices.

**Acceptance criteria**
- user can register with email and password
- user can sign in with email and password
- password reset flow works
- email verification flow works

### BL-007: Google sign-in
**User story**
As a user, I want to sign in with Google so onboarding is faster.

**Acceptance criteria**
- user can register or sign in with Google when configured
- existing account matching is handled correctly
- Google-first recovery path is supported

## Priority 2: Local Persistence and Mode Integrity

### BL-008: IndexedDB local adapter
**User story**
As a local-mode user, I want my data to actually be stored on my device so local mode is real.

**Acceptance criteria**
- IndexedDB adapter is implemented
- adapter can read, write, remove, and list keys
- local storage availability is handled safely

### BL-009: Local entity persistence conventions
**User story**
As a developer, I want local and cloud entity shapes to stay aligned so migration and maintenance are manageable.

**Acceptance criteria**
- local key strategy is defined
- entity serialization rules are defined
- local record shape aligns with future cloud entity shape

### BL-010: Local mode hydration and save behavior
**User story**
As a local-mode user, I want the app to load and save real local data instead of only unlocking routes.

**Acceptance criteria**
- local-mode screens can hydrate saved data
- local changes persist across refreshes
- local-mode UI reflects stored state correctly

## Priority 3: Onboarding and Account Bootstrap

### BL-011: Personalized onboarding flow
**User story**
As a new user, I want a short onboarding flow so the app feels tailored to me.

**Acceptance criteria**
- onboarding includes a small set of personalization questions
- optional and sensitive fields stay optional
- flow works in local and cloud modes

### BL-012: Onboarding completion state
**User story**
As the app, I want to know whether onboarding is complete so users can be routed correctly.

**Acceptance criteria**
- onboarding completion status is persisted
- app can redirect based on onboarding state
- incomplete onboarding users return to onboarding instead of skipping ahead

## Priority 4: Core Planning Domain

### BL-013: Categories/life areas
**User story**
As a user, I want categories so I can organize my progress better.

**Acceptance criteria**
- user can create, edit, and delete categories
- categories work in local and cloud modes

### BL-014: Dreams management
**User story**
As a user, I want to define long-term dreams so I can connect to bigger aspirations.

**Acceptance criteria**
- user can create, edit, archive, and delete dreams
- dreams can exist without goals
- dream data persists in local and cloud modes

### BL-015: Goals management
**User story**
As a user, I want to define concrete goals so I can focus on specific outcomes.

**Acceptance criteria**
- user can create, edit, archive, and delete goals
- goals can exist without dreams
- goals can optionally link to dreams
- goal data persists in local and cloud modes

## Priority 5: Action Tracking Core

### BL-016: Habits management
**User story**
As a user, I want recurring habits so I can build discipline and consistency.

**Acceptance criteria**
- user can create, edit, and delete habits
- habits support recurrence settings
- user can mark habits done
- habit data and completion history persist in local and cloud modes

### BL-017: Tasks management
**User story**
As a user, I want tasks so I can turn goals into action.

**Acceptance criteria**
- user can create, edit, and delete tasks
- tasks can optionally link to goals
- user can mark tasks complete
- task data and completion history persist in local and cloud modes

## Priority 6: Guided First-Use Setup

### BL-018: Required first goal setup
**User story**
As a new user, I want guided first steps so I do not land in an empty app.

**Acceptance criteria**
- user must create at least one goal before normal app usage
- setup flow is clear and helpful

### BL-019: Required first habit or task setup
**User story**
As a new user, I want to add at least one action item so the app becomes useful immediately.

**Acceptance criteria**
- user must create at least one habit or task
- setup progress is tracked
- dashboard unlock happens only after setup is satisfied

## Priority 7: Dashboard, Activity, and Streaks

### BL-020: Personalized dashboard
**User story**
As a user, I want a dashboard that shows my key progress so I stay motivated.

**Acceptance criteria**
- dashboard shows real user data
- dashboard highlights next useful action
- dashboard works in local and cloud modes

### BL-021: Activity history and progress timeline
**User story**
As a user, I want to see my activity history so I understand my consistency over time.

**Acceptance criteria**
- important actions are recorded in history
- user can view recent history entries
- progress-related actions are reflected in the timeline

### BL-022: Streak tracking
**User story**
As a user, I want streak tracking so I feel encouraged to stay consistent.

**Acceptance criteria**
- app tracks a general consistency streak
- habit-level streaks may also be shown
- streak rules are consistent and testable

## Priority 8: Weekly Improvement Loop

### BL-023: Weekly review experience
**User story**
As a user, I want a weekly review so I can reflect and improve.

**Acceptance criteria**
- weekly review screen exists
- review shows recent activity and consistency summary
- wins and missed areas are visible

### BL-024: Optional reflection/journaling
**User story**
As a user, I want optional reflection notes so I can capture personal insight.

**Acceptance criteria**
- user can add weekly reflections
- reflection entries are stored and retrievable
- reflection is optional and never blocks usage

## Priority 9: Settings, Profile, Reminders, and Migration

### BL-025: Reminder preferences and delivery
**User story**
As a user, I want to control reminders so the app supports me without becoming annoying.

**Acceptance criteria**
- user can enable or disable reminders
- user can choose reminder channels
- reminder delivery respects saved preferences

### BL-026: Profile and avatar
**User story**
As a user, I want a profile and avatar so the app feels personal.

**Acceptance criteria**
- user can edit profile information
- user can upload or choose an avatar/profile image
- optional identity fields remain optional

### BL-027: Theme and dark mode support
**User story**
As a user, I want dark mode and theme comfort so the app matches my preference.

**Acceptance criteria**
- dark mode is available
- theme preference is saved
- theme works consistently across core screens

### BL-028: Local-to-cloud migration
**User story**
As a local user, I want to convert to an account later without losing my progress.

**Acceptance criteria**
- local user can create or join a cloud account later
- local data is migrated successfully
- duplicate or broken data is avoided

## Priority 10: Admin and Product Oversight

### BL-029: Admin/tester dashboard
**User story**
As an admin or tester, I want product oversight tools so testing and improvement are efficient.

**Acceptance criteria**
- admin routes are protected
- dashboard includes user list, feature flags, bug/report visibility, analytics, and test account controls
- non-admin users cannot access admin features

### BL-030: Audit logs and analytics events
**User story**
As a product owner, I want audit and analytics data so I can understand usage and investigate issues.

**Acceptance criteria**
- important auth and admin events are logged
- core feature actions generate analytics events
- sensitive data is not exposed unnecessarily

## Priority 11: Launch Readiness

### BL-031: Responsive polish and accessibility pass
**User story**
As a user, I want the app to work well across devices so I can rely on it daily.

**Acceptance criteria**
- core flows work on mobile, desktop, and tablet
- accessibility quality is respected
- forms and navigation are usable without layout issues

### BL-032: Error handling and empty-state pass
**User story**
As a user, I want clear feedback when something fails so I am not confused.

**Acceptance criteria**
- major actions have success and error feedback
- empty states suggest the next useful step
- loading, retry, and failure states exist for major flows

### BL-033: MVP deployment and production readiness
**User story**
As a product owner, I want the MVP to be deployable and stable so real testers can use it.

**Acceptance criteria**
- production environment is configured
- backup and recovery basics are defined
- monitoring/logging is available
- app can be shared with external testers
- launch blockers are resolved

## MVP Cut Line Recommendation

If scope reduction is necessary, the strongest MVP cut line should preserve:
- BL-001 to BL-024
- BL-031 to BL-033

The following can be simplified if necessary:
- deeper migration tooling
- richer reminder channels
- broader admin tooling
