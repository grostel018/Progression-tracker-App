# Current Implementation Note

This document is a target-state sitemap and user-flow specification.

The current `next-app/` codebase only implements the public/auth flow plus protected placeholder shells for onboarding, dashboard, and admin. For the current code-aligned state, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`.

---
# MVP Sitemap and User Flow Specification

This document defines the screen-by-screen MVP sitemap and the main user flows for the next-generation version of Progression Tracker.

It is intended to bridge product planning, UX planning, and implementation.

## 1. Sitemap Overview

### Public screens

- Landing page
- Sign up
- Sign in
- Forgot password
- Reset password
- Email verification

### App screens

- Local mode entry / app start choice
- Onboarding
- Dashboard
- Dreams list
- Dream detail / edit
- Goals list
- Goal detail / edit
- Habits list
- Habit detail / edit
- Tasks list
- Task detail / edit
- Weekly review
- Profile
- Settings

### Admin screens

- Admin/tester dashboard
- User list
- Bug reports
- Feature flags
- Analytics overview

## 2. Screen-by-Screen Specification

## 2.1 Landing Page

### Purpose

Introduce the app, communicate value quickly, and guide users into either local mode or account-based usage.

### Main components

- hero section with core message
- short explanation of what the app helps users achieve
- primary call-to-action buttons
- sections for goals, habits, streaks, and weekly review benefits
- mobile-friendly visuals or product preview
- footer with legal/basic links

### Actions available

- start locally
- create account
- sign in
- optionally scroll to learn more

### Empty states

- not applicable in the usual app sense

### Validation/error states

- if service availability is low, show a lightweight fallback message rather than a broken CTA

### Mobile-first UX notes

- CTA buttons must be visible without too much scrolling
- sections should stack vertically and remain readable on small screens
- avoid overly dense feature grids on mobile

### Dependencies on backend/data

- mostly static content
- optional analytics event tracking for CTA clicks

## 2.2 Sign Up Screen

### Purpose

Allow a new user to create a cloud account.

### Main components

- email field
- username field
- password field
- confirm password field if used
- Google sign-in button
- link to sign in
- legal/privacy acknowledgment copy

### Actions available

- create account
- sign up with Google
- navigate to sign in

### Empty states

- first-use form with helper hints

### Validation/error states

- invalid email
- username already taken
- weak password
- password mismatch
- network/server failure
- Google sign-in failure

### Mobile-first UX notes

- keyboard-safe form layout
- large tap targets
- inline validation should not overwhelm the screen

### Dependencies on backend/data

- auth service
- user/account creation
- profile bootstrap
- onboarding status initialization

## 2.3 Sign In Screen

### Purpose

Allow an existing cloud user to access their account.

### Main components

- email field
- password field
- Google sign-in button
- forgot-password link
- create-account link

### Actions available

- sign in
- sign in with Google
- navigate to password reset
- navigate to registration

### Empty states

- first-use sign-in screen with minimal helper text

### Validation/error states

- invalid credentials
- account not verified
- rate limit or temporary lockout
- Google sign-in failure
- network/server failure

### Mobile-first UX notes

- keep the form short and centered
- ensure password manager compatibility
- avoid excessive marketing clutter on mobile auth screens

### Dependencies on backend/data

- auth service
- session creation
- optional local-data detection for migration prompts after login

## 2.4 Forgot Password Screen

### Purpose

Allow users to request a password reset.

### Main components

- email input
- submit button
- back to sign-in link

### Actions available

- send reset request
- return to sign in

### Empty states

- simple instructional state

### Validation/error states

- invalid email format
- rate limit
- generic success response regardless of whether account exists

### Mobile-first UX notes

- simple one-field layout
- avoid too much explanation text

### Dependencies on backend/data

- password reset token creation
- email delivery service

## 2.5 Reset Password Screen

### Purpose

Allow users to set a new password using a valid reset token.

### Main components

- new password field
- confirm password field
- submit button

### Actions available

- submit new password

### Empty states

- not applicable

### Validation/error states

- invalid or expired token
- weak password
- password mismatch
- server failure

### Mobile-first UX notes

- short vertical form
- clear success feedback and next step to sign in

### Dependencies on backend/data

- password reset verification
- password update

## 2.6 Email Verification Screen

### Purpose

Confirm account email ownership and complete account activation.

### Main components

- verification status message
- retry or resend verification action if needed
- continue-to-app or sign-in action

### Actions available

- verify token
- resend verification email
- continue after success

### Empty states

- pending verification message

### Validation/error states

- invalid token
- expired token
- already verified
- resend failure

### Mobile-first UX notes

- simple confirmation screen with one clear next action

### Dependencies on backend/data

- email verification token handling
- user record update

## 2.7 Local Mode Entry / App Start Choice

### Purpose

Let new users choose between local-only usage and cloud-backed usage.

### Main components

- explanation of local mode vs account mode
- start locally button
- create account button
- sign in button
- short note about syncing and migration later

### Actions available

- enter local mode
- create account
- sign in

### Empty states

- this screen itself is an initial decision screen

### Validation/error states

- if local persistence is unavailable, show a fallback message

### Mobile-first UX notes

- keep the decision simple and comparison lightweight
- avoid information overload about technical differences

### Dependencies on backend/data

- local storage readiness check
- analytics tracking

## 2.8 Onboarding Screen Flow

### Purpose

Capture minimal personalization and guide the user to their first meaningful setup.

### Main components

- short multi-step questionnaire
- progress indicator
- question cards
- setup actions for first goal creation
- setup actions for first habit or task creation

### Actions available

- answer onboarding questions
- skip optional questions where allowed
- create first goal
- create first habit or task
- continue to dashboard

### Empty states

- intentional guided empty-state experience during first setup

### Validation/error states

- required goal missing
- required habit/task missing
- invalid field values in onboarding forms
- interrupted local/cloud persistence save

### Mobile-first UX notes

- one question cluster per screen where possible
- minimal text blocks
- persistent progress indicator
- large next/continue actions

### Dependencies on backend/data

- onboarding preferences storage
- goal creation
- habit or task creation
- user/account or local profile bootstrap

## 2.9 Dashboard

### Purpose

Serve as the main home screen showing momentum, focus, and progress.

### Main components

- greeting/personalized header
- streak summary
- current focus or most-active goal
- recent activity list
- weekly review prompt
- progress summary cards
- quick actions for add goal, add habit, add task

### Actions available

- open dream/goal/habit/task screens
- log or complete actions quickly
- start weekly review
- navigate to profile/settings

### Empty states

- no goals yet
- no habits/tasks yet
- no activity yet
- no weekly review yet

Each empty state should guide the next action clearly.

### Validation/error states

- failure to load dashboard data
- partial loading failures for cards/widgets
- retry action available

### Mobile-first UX notes

- stack cards vertically
- prioritize one main focus area above the fold
- avoid too many charts in MVP mobile layout

### Dependencies on backend/data

- user/profile data
- goals
- habits
- tasks
- activity events
- streaks
- weekly review availability/status

## 2.10 Dreams List Screen

### Purpose

Let users see and manage long-term aspirations.

### Main components

- screen title
- add dream button
- dream cards/list items
- filters by category or status if needed

### Actions available

- create dream
- view dream details
- edit dream
- archive/delete dream

### Empty states

- no dreams created yet
- explain what dreams are and encourage creation

### Validation/error states

- invalid dream form submission
- failure to load dreams
- delete/archive failure

### Mobile-first UX notes

- cards should summarize title, status, and optional linked-goal count
- swipe actions are optional but not required for MVP

### Dependencies on backend/data

- dreams table
- optional category data
- optional linked goal counts

## 2.11 Dream Detail / Edit Screen

### Purpose

Show a single dream, its details, and its linked goals if any.

### Main components

- dream title and description
- status controls
- category label
- target date if present
- linked goals section
- edit form or edit mode

### Actions available

- update dream
- archive dream
- delete dream
- navigate to linked goals
- create a goal from this dream

### Empty states

- no linked goals yet
- encourage user to attach or create a goal if relevant

### Validation/error states

- invalid form values
- save failure
- delete/archive failure

### Mobile-first UX notes

- use collapsible sections if needed
- keep linked goals easy to scan

### Dependencies on backend/data

- dream record
- linked goals
- categories

## 2.12 Goals List Screen

### Purpose

Let users see and manage concrete objectives.

### Main components

- add goal button
- goal cards/list
- filters for category, status, or linked dream

### Actions available

- create goal
- open goal detail
- edit goal
- archive/delete goal

### Empty states

- no goals yet
- encourage users to define a concrete objective

### Validation/error states

- invalid goal form submission
- failure to load goals
- save/delete failure

### Mobile-first UX notes

- show essential metadata only: title, status, optional target date, progress snapshot
- avoid dense analytics on the list screen

### Dependencies on backend/data

- goals table
- optional dream/category references

## 2.13 Goal Detail / Edit Screen

### Purpose

Show one goal as the main work area for associated habits and tasks.

### Main components

- goal title and description
- linked dream if any
- target date and progress area
- associated habits section
- associated tasks section
- recent activity for this goal
- edit actions

### Actions available

- edit goal
- link/unlink dream
- create habit for goal
- create task for goal
- update progress if supported
- archive/delete goal

### Empty states

- no linked dream
- no habits yet
- no tasks yet
- no activity yet

### Validation/error states

- invalid goal updates
- failed habit/task creation within goal context
- save/delete failure

### Mobile-first UX notes

- treat this as a structured vertical workspace
- prioritize habits/tasks over heavy metadata
- keep quick-add actions visible

### Dependencies on backend/data

- goal record
- dream relation
- habits linked to goal
- tasks linked to goal
- activity events filtered by goal

## 2.14 Habits List Screen

### Purpose

Let users manage recurring actions.

### Main components

- add habit button
- habit cards/list
- recurrence indicators
- quick complete action

### Actions available

- create habit
- mark habit done
- open habit detail
- edit habit
- archive/delete habit

### Empty states

- no habits yet
- explain how habits support consistency

### Validation/error states

- invalid recurrence settings
- duplicate completion if not allowed by rules
- failure to load or save

### Mobile-first UX notes

- support fast completion from list view
- recurrence information should be visible without opening detail view

### Dependencies on backend/data

- habits table
- habit completion records
- optional goal/category relations
- streak calculation or cached streak data

## 2.15 Habit Detail / Edit Screen

### Purpose

Show one habit’s definition, history, and consistency.

### Main components

- habit title and description
- recurrence settings
- linked goal if any
- recent completion history
- streak summary
- edit form or actions

### Actions available

- mark habit done
- edit habit
- change recurrence
- archive/delete habit

### Empty states

- no completions yet
- encourage first completion

### Validation/error states

- invalid recurrence configuration
- failed completion save
- failed update or archive

### Mobile-first UX notes

- keep completion CTA prominent
- use compact history list or calendar-style summary only if simple

### Dependencies on backend/data

- habit record
- habit completions
- optional goal/category relation
- streak data

## 2.16 Tasks List Screen

### Purpose

Let users manage actionable tasks.

### Main components

- add task button
- task list/cards
- due date display
- quick complete action

### Actions available

- create task
- mark task complete
- open task detail
- edit task
- archive/delete task

### Empty states

- no tasks yet
- explain how tasks turn goals into action

### Validation/error states

- invalid task form submission
- failed completion save
- load/save/delete failure

### Mobile-first UX notes

- task list should prioritize clarity and tap speed
- due date should be visible but not noisy

### Dependencies on backend/data

- tasks table
- task completion records
- optional goal/category relations

## 2.17 Task Detail / Edit Screen

### Purpose

Show one task and its completion history.

### Main components

- task title and description
- due date
- linked goal if any
- completion history
- edit controls

### Actions available

- complete task
- edit task
- archive/delete task

### Empty states

- no completion history yet

### Validation/error states

- invalid task updates
- completion failure
- deletion/archive failure

### Mobile-first UX notes

- keep the complete action visible near the top
- minimize secondary metadata clutter

### Dependencies on backend/data

- task record
- linked goal/category
- task completions

## 2.18 Weekly Review Screen

### Purpose

Help the user reflect on recent consistency, progress, and next steps.

### Main components

- weekly summary header
- streak and activity summary
- wins section
- missed areas section
- optional reflection input
- complete review action

### Actions available

- read weekly summary
- write reflection
- save reflection
- mark weekly review complete

### Empty states

- not enough activity yet for a meaningful review
- encourage continued use and return next week

### Validation/error states

- failed summary load
- failed reflection save
- failed review completion save

### Mobile-first UX notes

- break the review into stacked sections
- keep writing area comfortable on mobile
- avoid overly dense charts in MVP

### Dependencies on backend/data

- weekly review aggregate data
- activity events
- streaks
- reflections
- weekly review record persistence

## 2.19 Profile Screen

### Purpose

Allow users to manage personal profile information.

### Main components

- avatar/profile image
- display name
- optional bio
- optional gender field
- profile visibility/discoverability if included in MVP settings

### Actions available

- upload/change avatar
- update profile fields
- save profile

### Empty states

- no avatar set
- no bio/profile details yet

### Validation/error states

- invalid upload type or size
- failed profile save

### Mobile-first UX notes

- keep uploads simple
- do not force too many profile fields
- privacy-sensitive fields must be clearly optional

### Dependencies on backend/data

- profile data
- media storage for avatar if enabled

## 2.20 Settings Screen

### Purpose

Allow users to control app preferences, reminders, and account-related settings.

### Main components

- theme settings
- reminder preferences
- notification preferences
- account settings
- local-to-cloud migration entry point if user is local

### Actions available

- toggle dark mode
- configure reminder channels
- configure reminder timing
- open migration flow
- sign out if authenticated

### Empty states

- reminders not configured yet
- encourage enabling reminders if useful

### Validation/error states

- invalid reminder settings
- failed settings save
- failed migration start

### Mobile-first UX notes

- group settings into sections
- avoid long endless forms
- use switches and compact controls where possible

### Dependencies on backend/data

- reminder preferences
- notification preferences
- profile theme preferences
- auth state
- local data detection for migration

## 2.21 Admin/Tester Dashboard

### Purpose

Provide oversight and testing tools for the owner, trusted testers, and admins.

### Main components

- overview cards
- user count and user list preview
- bug reports summary
- feature flag summary
- analytics snapshot
- navigation to admin subsections

### Actions available

- view users
- view bug reports
- manage feature flags
- inspect analytics
- access tester/admin tools

### Empty states

- no bug reports yet
- no analytics data yet
- no feature flags yet

### Validation/error states

- unauthorized access
- failed admin data load
- save failures for flags or admin actions

### Mobile-first UX notes

- mobile access can be supported, but admin UX may remain more desktop-oriented
- still ensure basic readability and navigation on smaller screens

### Dependencies on backend/data

- role-based access
- user records
- bug reports
- feature flags
- analytics data
- audit logs

## 2.22 User List Screen

### Purpose

Let admins/testers inspect registered user accounts.

### Main components

- searchable/filterable table or list
- user role/status indicators
- account age/basic activity indicators if available

### Actions available

- inspect user
- filter users
- optionally mark tester/admin access if included in MVP

### Empty states

- no users yet

### Validation/error states

- unauthorized access
- failed user list load

### Mobile-first UX notes

- use stacked cards instead of wide tables on small screens

### Dependencies on backend/data

- users
- profiles
- optional audit/analytics summaries

## 2.23 Bug Reports Screen

### Purpose

Allow admins/testers to view issue submissions and track status.

### Main components

- bug report list
- severity and status filters
- report detail view

### Actions available

- open report
- update status if supported in MVP

### Empty states

- no bug reports yet

### Validation/error states

- failed report load
- failed status update

### Mobile-first UX notes

- compact severity/status chips
- detailed view should remain readable vertically

### Dependencies on backend/data

- bug reports
- optional reporter references

## 2.24 Feature Flags Screen

### Purpose

Let admins/testers control gated features.

### Main components

- feature flag list
- enabled/disabled toggle
- optional audience scope display

### Actions available

- toggle feature flags
- inspect feature flag configuration

### Empty states

- no feature flags defined yet

### Validation/error states

- unauthorized access
- failed feature flag update

### Mobile-first UX notes

- toggles should be easy to use on touch
- keep descriptions short and scannable

### Dependencies on backend/data

- feature flags
- audit logs for sensitive changes if implemented

## 2.25 Analytics Overview Screen

### Purpose

Provide a high-level view of product usage for testers/admins.

### Main components

- user count cards
- activity count summaries
- onboarding completion summary
- optional weekly engagement summary

### Actions available

- inspect metrics
- filter time range if supported

### Empty states

- no analytics yet

### Validation/error states

- unauthorized access
- failed analytics load

### Mobile-first UX notes

- keep charts minimal in MVP
- use stacked summary cards first

### Dependencies on backend/data

- analytics events or aggregated product metrics
- user counts
- activity events
- onboarding completion data

## 3. Main User Flows

## 3.1 First-Time Local User Flow

1. User lands on landing page.
2. User selects `Start locally`.
3. App checks local persistence availability.
4. User enters onboarding flow.
5. User answers personalization questions.
6. User creates first goal.
7. User creates first habit or task.
8. User is routed to dashboard.
9. User continues using dreams, goals, habits, tasks, and weekly review without an account.

### Key flow dependencies

- local storage
- onboarding state
- local entity creation for goals/habits/tasks

## 3.2 First-Time Cloud User Flow

1. User lands on landing page.
2. User chooses `Create account`.
3. User registers with email/password or Google.
4. If email/password, user completes email verification.
5. User enters onboarding flow.
6. User answers personalization questions.
7. User creates first goal.
8. User creates first habit or task.
9. User is routed to dashboard.
10. User data is now cloud-backed.

### Key flow dependencies

- auth service
- user/profile creation
- onboarding preferences persistence
- first content creation

## 3.3 Returning User Flow

1. User opens app.
2. App detects whether user is authenticated, local-only, or needs sign-in.
3. User returns directly to dashboard if already active in session/local mode.
4. User sees updated dashboard with streak, recent activity, and next suggested actions.
5. User navigates to goals, habits, tasks, dreams, or weekly review.

### Key flow dependencies

- session or local state restoration
- dashboard data loading
- activity/streak refresh

## 3.4 Local-to-Cloud Migration Flow

1. Local user opens settings or is prompted after trying an account-only feature.
2. App explains benefits of cloud mode and confirms migration intent.
3. User signs up or signs in.
4. App detects local data.
5. App shows migration confirmation.
6. App migrates categories, dreams, goals, habits, tasks, completions, reviews, and preferences in the correct order.
7. App confirms migration success.
8. User is routed to cloud-backed dashboard.

### Key flow dependencies

- local data detection
- auth flow
- migration service
- conflict handling strategy

## 3.5 Admin/Tester Flow

1. Admin or tester signs in.
2. Role/permission check grants access to admin routes.
3. User opens admin dashboard.
4. User can inspect users, bug reports, feature flags, and analytics.
5. Sensitive changes such as flag updates are logged.

### Key flow dependencies

- auth state
- role/permission checks
- admin data loaders
- audit logging

## 4. Key Cross-Screen UX Rules

- Every core screen should have a useful empty state.
- Forms should prefer progressive disclosure over dense form layouts.
- Mobile layouts should prioritize one primary action per view.
- Sensitive profile fields must remain optional.
- The app should avoid overwhelming users with too much data at once.
- Dashboard and review screens should feel motivating, not sterile.

## 5. Recommended Next Step

The strongest next step after this sitemap is to convert it into:

1. a wireframe specification with component-level layout notes, or
2. a frontend route map and UI implementation plan aligned with the milestones.


