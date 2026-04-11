# Current Implementation Note

This document describes the planned target database design for the future MVP.

The current Prisma schema implemented in `next-app/` is intentionally smaller and currently covers only the auth/identity bootstrap layer. For the current code-aligned state, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`.

---
# Database Design and ERD Specification

This document defines the proposed database design for the planned next-generation version of Progression Tracker. It translates the product plan and technical architecture into a concrete data model suitable for implementation.

## 1. Design Goals

The database design should:

- support both short-term tracking and long-term planning
- support goals without dreams and dreams without goals
- support a local-first mode and a cloud-backed mode with similar structure
- preserve history instead of storing only current state
- support future social/community features without forcing them into the MVP schema
- stay maintainable for a solo developer

## 2. Modeling Principles

### User ownership first

Almost all core records in MVP should be owned by a user.

### Separate definitions from events

Do not store only current state. Track important actions as separate historical records where needed.

### Optional relationships where product requires flexibility

- goals may exist without dreams
- habits and tasks may exist without a goal when appropriate

### Keep MVP schema focused

Prepare for future expansion, but do not prematurely model full social systems.

## 3. High-Level Entity List

### Identity and account

- users
- profiles
- onboarding_preferences
- auth_accounts
- sessions

### Planning and tracking

- categories
- dreams
- goals
- habits
- habit_completions
- tasks
- task_completions
- streaks
- activity_events
- weekly_reviews
- reflections

### Preferences and communication

- reminder_preferences
- reminders
- notifications

### Admin and product operations

- bug_reports
- feature_flags
- audit_logs

## 4. ERD-Style Relationship Overview

```text
users
  1 -> 1 profiles
  1 -> 1 onboarding_preferences
  1 -> many categories
  1 -> many dreams
  1 -> many goals
  1 -> many habits
  1 -> many tasks
  1 -> many habit_completions
  1 -> many task_completions
  1 -> many activity_events
  1 -> many weekly_reviews
  1 -> many reflections
  1 -> many reminder_preferences
  1 -> many reminders
  1 -> many notifications
  1 -> many bug_reports
  1 -> many audit_logs

categories
  1 -> many dreams
  1 -> many goals

dreams
  1 -> many goals

goals
  0..1 -> one dream
  1 -> many habits
  1 -> many tasks

habits
  1 -> many habit_completions

tasks
  1 -> many task_completions

weekly_reviews
  1 -> many reflections (optional design choice)
```

## 5. Table Design Overview

## 5.1 users

Purpose:
- root identity table for registered cloud users

Key fields:
- id
- email
- username
- password_hash nullable for OAuth-only accounts if needed
- email_verified_at nullable
- role enum or role field
- status
- created_at
- updated_at

Notes:
- local-only users should not need a row here until they migrate
- keep role simple in MVP: user, admin, tester

## 5.2 profiles

Purpose:
- user profile and presentation information

Key fields:
- id
- user_id unique
- display_name
- avatar_url nullable
- bio nullable
- gender nullable
- ui_theme_preference nullable
- created_at
- updated_at

Notes:
- optional identity fields must remain optional
- future public profile support can be layered here later

## 5.3 onboarding_preferences

Purpose:
- stores onboarding answers and personalization configuration

Key fields:
- id
- user_id unique
- focus_area nullable
- motivation_style nullable
- struggle_areas json or normalized table depending on final design
- reminder_preference_summary nullable
- onboarding_completed_at nullable
- created_at
- updated_at

Notes:
- if multiple-selection onboarding answers grow, a normalized child table may be better later
- MVP can tolerate a compact representation if kept controlled

## 5.4 auth_accounts

Purpose:
- external auth provider linkage

Key fields:
- id
- user_id
- provider
- provider_account_id
- created_at

Notes:
- needed for Google OAuth and future provider support
- may be managed by auth library conventions

## 5.5 sessions

Purpose:
- track authenticated sessions if session persistence is database-backed

Key fields:
- id
- user_id
- session_token
- expires_at
- created_at

Notes:
- actual shape may depend on auth library

## 5.6 categories

Purpose:
- life areas or user-defined organization buckets

Key fields:
- id
- user_id
- name
- color nullable
- icon nullable
- created_at
- updated_at

Constraints:
- unique name per user if desired

## 5.7 dreams

Purpose:
- stores long-term aspirations

Key fields:
- id
- user_id
- category_id nullable
- title
- description nullable
- status
- target_date nullable
- archived_at nullable
- created_at
- updated_at

Notes:
- dreams should not require linked goals
- status can start simple: active, paused, completed, archived

## 5.8 goals

Purpose:
- stores concrete objectives

Key fields:
- id
- user_id
- category_id nullable
- dream_id nullable
- title
- description nullable
- goal_type nullable
- measurement_type nullable
- target_value nullable
- current_value nullable
- target_date nullable
- status
- archived_at nullable
- created_at
- updated_at

Notes:
- `dream_id` must be nullable
- support both measurable and non-measurable goals
- measurement_type could later distinguish percentage, count, binary, duration, etc.

## 5.9 habits

Purpose:
- recurring behavior definitions

Key fields:
- id
- user_id
- goal_id nullable
- category_id nullable
- title
- description nullable
- frequency_type
- frequency_config json or normalized recurrence details
- status
- created_at
- updated_at

Notes:
- habits may optionally link to goals
- recurrence design should be pragmatic in MVP
- frequency config may later need normalization if scheduling grows complex

## 5.10 habit_completions

Purpose:
- stores individual habit completion events

Key fields:
- id
- user_id
- habit_id
- completed_on date or timestamp
- quantity nullable
- note nullable
- created_at

Constraints:
- likely unique per habit/date depending on habit rules

Notes:
- separate event table is important for history, streaks, and analytics

## 5.11 tasks

Purpose:
- stores task definitions or user action items

Key fields:
- id
- user_id
- goal_id nullable
- category_id nullable
- title
- description nullable
- due_date nullable
- repeat_type nullable
- status
- created_at
- updated_at

Notes:
- tasks may be one-off or optionally repeated later
- do not overcomplicate repeating task logic in MVP unless required

## 5.12 task_completions

Purpose:
- stores completion history for tasks

Key fields:
- id
- user_id
- task_id
- completed_at
- note nullable
- created_at

Notes:
- separate completion records help preserve history instead of overwriting state

## 5.13 streaks

Purpose:
- stores derived or cached streak information for performance and product visibility

Key fields:
- id
- user_id
- streak_type
- related_entity_type nullable
- related_entity_id nullable
- current_count
- longest_count
- last_counted_on nullable
- updated_at

Notes:
- supports both general streaks and entity-specific streaks
- can be recomputed from history if needed, but cached values are helpful for dashboard speed

## 5.14 activity_events

Purpose:
- normalized activity timeline for user actions

Key fields:
- id
- user_id
- event_type
- entity_type nullable
- entity_id nullable
- metadata json nullable
- occurred_at
- created_at

Example event types:
- goal_created
- habit_completed
- task_completed
- weekly_review_completed
- streak_milestone

Notes:
- this table supports dashboard timelines and lightweight analytics
- do not use it as the only source of truth for transactional data

## 5.15 weekly_reviews

Purpose:
- stores generated or user-confirmed weekly review summaries

Key fields:
- id
- user_id
- review_week_start
- review_week_end
- summary_snapshot json nullable
- completed_at nullable
- created_at
- updated_at

Notes:
- useful for saving the user's review history rather than generating everything live each time

## 5.16 reflections

Purpose:
- stores optional written reflections or journal-style entries

Key fields:
- id
- user_id
- weekly_review_id nullable
- title nullable
- body
- created_at
- updated_at

Notes:
- can be linked to a weekly review or stand alone if desired

## 5.17 reminder_preferences

Purpose:
- stores user reminder settings

Key fields:
- id
- user_id
- channel_type
- enabled
- schedule_config json nullable
- quiet_hours_config json nullable
- created_at
- updated_at

Notes:
- separate preference rows allow multiple channels like email and browser

## 5.18 reminders

Purpose:
- stores actual reminder definitions or scheduled reminder items

Key fields:
- id
- user_id
- related_entity_type nullable
- related_entity_id nullable
- title
- message nullable
- channel_type
- scheduled_for nullable
- status
- created_at
- updated_at

Notes:
- keep reminder modeling simple in MVP
- deeper scheduling systems can be added later

## 5.19 notifications

Purpose:
- stores in-app notification records

Key fields:
- id
- user_id
- notification_type
- title
- body nullable
- read_at nullable
- metadata json nullable
- created_at

## 5.20 bug_reports

Purpose:
- tester/admin visible issue reports

Key fields:
- id
- reporter_user_id nullable
- title
- description
- status
- severity nullable
- created_at
- updated_at

## 5.21 feature_flags

Purpose:
- support controlled rollout and testing

Key fields:
- id
- key
- description nullable
- enabled
- audience_scope nullable
- created_at
- updated_at

## 5.22 audit_logs

Purpose:
- record security-relevant or admin-level actions

Key fields:
- id
- actor_user_id nullable
- action
- target_type nullable
- target_id nullable
- metadata json nullable
- created_at

## 6. Ownership and Authorization Rules

### Core ownership rule

Every user-owned table should contain `user_id` unless there is a very strong reason not to.

This applies to:
- categories
- dreams
- goals
- habits
- tasks
- completions
- activity events
- weekly reviews
- reflections
- reminders
- notifications

### Authorization principle

A user must never be able to access another user's owned records except through explicitly public features that will be added later.

## 7. Local Mode vs Cloud Mode

### Cloud mode

Use PostgreSQL as the system of record.

### Local mode

Use IndexedDB or equivalent local browser persistence with the same conceptual model.

### Important requirement

The local and cloud models should remain structurally similar enough that migration is possible without brittle mapping logic.

### Migration guidance

When a local user upgrades to an account:
- create user and profile data first
- import categories, dreams, goals, habits, tasks, and history
- preserve IDs through client-side temporary mapping if needed
- migrate events/completions after definitions so relationships can be restored

## 8. Indexing Guidance

The initial schema should include indexes for:

- `users.email`
- `users.username`
- ownership queries by `user_id`
- optional relationship lookups such as `dream_id`, `goal_id`, and `category_id`
- time-based queries on completions and activity
- weekly review date ranges
- notification unread status
- audit log time ordering

Priority indexes likely needed early:
- `(user_id, created_at)` on major timeline tables
- `(user_id, status)` on dreams, goals, habits, tasks
- `(habit_id, completed_on)` on habit completions
- `(task_id, completed_at)` on task completions
- `(user_id, occurred_at)` on activity events

## 9. Suggested Enums or Controlled Fields

Likely controlled values include:

- user role
- user status
- dream status
- goal status
- habit status
- task status
- frequency type
- event type
- notification type
- reminder channel type
- bug report status
- bug report severity

Keep enums minimal in MVP to avoid migration pain.

## 10. What Not to Model Yet

Avoid adding these too early:

- full social graph tables
- follower/friend systems
- complex public feed ranking models
- achievements and badge economies unless clearly required
- advanced moderation models beyond placeholders
- monetization billing models before product validation

## 11. Implementation Recommendation

When converting this design into a real schema:

1. start with the user-owned core domain tables
2. add completion/event/history tables next
3. add weekly review and reflection tables
4. add preferences and notifications
5. add admin and audit tables
6. only then add future-facing expansion tables when product needs justify them

## 12. Final Recommendation

This schema should be implemented as a pragmatic relational design that prioritizes clarity, ownership, history preservation, and future flexibility. The most important rule is to preserve the product's flexibility without turning the MVP database into a speculative platform schema.


