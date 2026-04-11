# Visual ERD and Migration Plan

This document turns the planned Progression Tracker data model into a visual ERD and a practical migration plan. It is intended to bridge the gap between product planning and actual implementation.

## 1. ERD Overview

The MVP data model is organized into four main areas:

- identity and account
- planning and tracking
- reminders and user experience
- admin and operational oversight

## 2. Visual ERD

```mermaid
erDiagram
    USERS ||--|| PROFILES : has
    USERS ||--|| ONBOARDING_PREFERENCES : has
    USERS ||--o{ AUTH_ACCOUNTS : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ CATEGORIES : owns
    USERS ||--o{ DREAMS : owns
    USERS ||--o{ GOALS : owns
    USERS ||--o{ HABITS : owns
    USERS ||--o{ TASKS : owns
    USERS ||--o{ HABIT_COMPLETIONS : owns
    USERS ||--o{ TASK_COMPLETIONS : owns
    USERS ||--o{ ACTIVITY_EVENTS : owns
    USERS ||--o{ STREAKS : owns
    USERS ||--o{ WEEKLY_REVIEWS : owns
    USERS ||--o{ REFLECTIONS : owns
    USERS ||--o{ REMINDER_PREFERENCES : owns
    USERS ||--o{ REMINDERS : owns
    USERS ||--o{ NOTIFICATIONS : owns
    USERS ||--o{ BUG_REPORTS : creates
    USERS ||--o{ AUDIT_LOGS : triggers

    CATEGORIES ||--o{ DREAMS : organizes
    CATEGORIES ||--o{ GOALS : organizes

    DREAMS ||--o{ GOALS : contains

    GOALS ||--o{ HABITS : supports
    GOALS ||--o{ TASKS : supports

    HABITS ||--o{ HABIT_COMPLETIONS : records
    TASKS ||--o{ TASK_COMPLETIONS : records

    WEEKLY_REVIEWS ||--o{ REFLECTIONS : includes

    USERS {
        string id PK
        string email UK
        string username UK
        string password_hash
        datetime email_verified_at
        string role
        string status
        datetime created_at
        datetime updated_at
    }

    PROFILES {
        string id PK
        string user_id FK UK
        string display_name
        string avatar_url
        string bio
        string gender
        string ui_theme_preference
        datetime created_at
        datetime updated_at
    }

    ONBOARDING_PREFERENCES {
        string id PK
        string user_id FK UK
        string focus_area
        string motivation_style
        json struggle_areas
        string reminder_preference_summary
        datetime onboarding_completed_at
        datetime created_at
        datetime updated_at
    }

    AUTH_ACCOUNTS {
        string id PK
        string user_id FK
        string provider
        string provider_account_id
        datetime created_at
    }

    SESSIONS {
        string id PK
        string user_id FK
        string session_token UK
        datetime expires_at
        datetime created_at
    }

    CATEGORIES {
        string id PK
        string user_id FK
        string name
        string color
        string icon
        datetime created_at
        datetime updated_at
    }

    DREAMS {
        string id PK
        string user_id FK
        string category_id FK
        string title
        string description
        string status
        date target_date
        datetime archived_at
        datetime created_at
        datetime updated_at
    }

    GOALS {
        string id PK
        string user_id FK
        string category_id FK
        string dream_id FK
        string title
        string description
        string goal_type
        string measurement_type
        decimal target_value
        decimal current_value
        date target_date
        string status
        datetime archived_at
        datetime created_at
        datetime updated_at
    }

    HABITS {
        string id PK
        string user_id FK
        string goal_id FK
        string category_id FK
        string title
        string description
        string frequency_type
        json frequency_config
        string status
        datetime created_at
        datetime updated_at
    }

    HABIT_COMPLETIONS {
        string id PK
        string user_id FK
        string habit_id FK
        datetime completed_on
        decimal quantity
        string note
        datetime created_at
    }

    TASKS {
        string id PK
        string user_id FK
        string goal_id FK
        string category_id FK
        string title
        string description
        datetime due_date
        string repeat_type
        string status
        datetime created_at
        datetime updated_at
    }

    TASK_COMPLETIONS {
        string id PK
        string user_id FK
        string task_id FK
        datetime completed_at
        string note
        datetime created_at
    }

    STREAKS {
        string id PK
        string user_id FK
        string streak_type
        string related_entity_type
        string related_entity_id
        int current_count
        int longest_count
        date last_counted_on
        datetime updated_at
    }

    ACTIVITY_EVENTS {
        string id PK
        string user_id FK
        string event_type
        string entity_type
        string entity_id
        json metadata
        datetime occurred_at
        datetime created_at
    }

    WEEKLY_REVIEWS {
        string id PK
        string user_id FK
        date review_week_start
        date review_week_end
        json summary_snapshot
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    REFLECTIONS {
        string id PK
        string user_id FK
        string weekly_review_id FK
        string title
        text body
        datetime created_at
        datetime updated_at
    }

    REMINDER_PREFERENCES {
        string id PK
        string user_id FK
        string channel_type
        boolean enabled
        json schedule_config
        json quiet_hours_config
        datetime created_at
        datetime updated_at
    }

    REMINDERS {
        string id PK
        string user_id FK
        string related_entity_type
        string related_entity_id
        string title
        string message
        string channel_type
        datetime scheduled_for
        string status
        datetime created_at
        datetime updated_at
    }

    NOTIFICATIONS {
        string id PK
        string user_id FK
        string notification_type
        string title
        string body
        datetime read_at
        json metadata
        datetime created_at
    }

    BUG_REPORTS {
        string id PK
        string reporter_user_id FK
        string title
        text description
        string status
        string severity
        datetime created_at
        datetime updated_at
    }

    FEATURE_FLAGS {
        string id PK
        string key UK
        string description
        boolean enabled
        string audience_scope
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOGS {
        string id PK
        string actor_user_id FK
        string action
        string target_type
        string target_id
        json metadata
        datetime created_at
    }
```

## 3. Relationship Notes

### Core flexibility rules

- `dreams` do not require goals
- `goals` do not require dreams
- `habits` and `tasks` may optionally link to goals
- `category_id` should remain optional on dreams, goals, habits, and tasks unless product scope later requires stricter organization

### History preservation rules

- `habit_completions` and `task_completions` store event history separately from definitions
- `activity_events` provide a normalized timeline for dashboard and review features
- `weekly_reviews` and `reflections` preserve review history instead of regenerating everything dynamically

### Ownership rules

All user-owned tables should include `user_id` directly, even when linked to another owned entity. This simplifies authorization checks and reduces ambiguity.

## 4. Suggested Migration Strategy

The schema should be introduced in phases so the implementation stays stable and understandable.

## Phase 1: Identity and Core Ownership

### Goal
Create the minimum user/account layer and the structural base needed for all user-owned data.

### Tables in this phase

- users
- profiles
- onboarding_preferences
- auth_accounts
- sessions

### Why first

Everything else depends on user identity and user ownership.

### Key migration notes

- enforce unique email and username constraints
- keep role and status fields simple
- create one-to-one relationship from users to profiles and onboarding preferences

## Phase 2: Planning and Organization

### Goal
Enable the user to define their longer-term and shorter-term intentions.

### Tables in this phase

- categories
- dreams
- goals

### Why second

These are the core planning entities that the rest of the app depends on.

### Key migration notes

- make `dream_id` nullable in goals
- make `category_id` nullable where appropriate
- add indexes for user ownership and status-based listing

## Phase 3: Tracking Definitions

### Goal
Enable the creation of recurring and actionable items.

### Tables in this phase

- habits
- tasks

### Why third

The user needs these definitions before completions and streaks can work.

### Key migration notes

- keep recurrence modeling simple
- support optional `goal_id`
- avoid overdesigning repeating task systems in the first schema

## Phase 4: Tracking Events and Momentum

### Goal
Capture actual user activity and support progress visibility.

### Tables in this phase

- habit_completions
- task_completions
- activity_events
- streaks

### Why fourth

Once definitions exist, the app can start recording real activity.

### Key migration notes

- separate completion history from definition tables
- add indexes for `user_id`, entity foreign keys, and time-based queries
- keep streaks as a cacheable/derived table, not the only source of truth

## Phase 5: Review and Reflection

### Goal
Support weekly improvement loops and stored insight history.

### Tables in this phase

- weekly_reviews
- reflections

### Why fifth

Weekly review depends on the event history created in earlier phases.

### Key migration notes

- store summary snapshots for historical consistency
- make reflection-to-review linkage optional if flexibility is desired

## Phase 6: Preferences and Notifications

### Goal
Add retention, personalization, and reminder support.

### Tables in this phase

- reminder_preferences
- reminders
- notifications

### Why sixth

These features improve engagement but are not blockers for the earliest tracking implementation.

### Key migration notes

- keep reminder scheduling data simple
- avoid complex job-system assumptions in the schema itself

## Phase 7: Admin and Operational Support

### Goal
Support testing, product oversight, and controlled rollout.

### Tables in this phase

- bug_reports
- feature_flags
- audit_logs

### Why seventh

These are important for launch and controlled testing, but they should not block the core user experience.

### Key migration notes

- add indexes for time ordering and common admin filtering
- keep feature flag model simple in MVP
- use audit logs for security-sensitive and admin-sensitive actions

## 5. Migration Dependency Summary

### Order of dependency

1. users
2. profiles, onboarding_preferences, auth_accounts, sessions
3. categories, dreams, goals
4. habits, tasks
5. habit_completions, task_completions, activity_events, streaks
6. weekly_reviews, reflections
7. reminder_preferences, reminders, notifications
8. bug_reports, feature_flags, audit_logs

### Important dependency rules

- `profiles.user_id` depends on `users.id`
- `dreams.user_id` depends on `users.id`
- `goals.dream_id` depends on `dreams.id` but must remain nullable
- `habits.goal_id` and `tasks.goal_id` depend on `goals.id` but must remain nullable
- completion tables must not exist before their parent definition tables
- weekly review features should not be migrated before activity history tables exist

## 6. Indexing Plan by Phase

### Phase 1 indexes

- unique index on `users.email`
- unique index on `users.username`
- unique index on `sessions.session_token`

### Phase 2 indexes

- index on `categories.user_id`
- index on `dreams.user_id`
- index on `goals.user_id`
- index on `goals.dream_id`
- index on `(user_id, status)` for dreams and goals

### Phase 3 indexes

- index on `habits.user_id`
- index on `tasks.user_id`
- index on `habits.goal_id`
- index on `tasks.goal_id`

### Phase 4 indexes

- index on `(habit_id, completed_on)`
- index on `(task_id, completed_at)`
- index on `(user_id, occurred_at)` for activity events
- index on `(user_id, streak_type)` for streaks

### Phase 5 indexes

- index on `(user_id, review_week_start)` for weekly reviews
- index on `reflections.weekly_review_id`

### Phase 6 indexes

- index on `(user_id, channel_type)` for reminder preferences
- index on `(user_id, scheduled_for)` for reminders
- index on `(user_id, read_at)` for notifications

### Phase 7 indexes

- index on `bug_reports.status`
- index on `audit_logs.created_at`
- unique index on `feature_flags.key`

## 7. Data Migration Notes for Local-to-Cloud Import

When importing local-mode data into cloud mode, use this order:

1. create user record
2. create profile and onboarding preferences
3. import categories
4. import dreams
5. import goals
6. import habits and tasks
7. import completions and activity events
8. import weekly reviews and reflections
9. import reminder preferences if local mode supports them

Important rule:
- definitions must be imported before historical events that depend on them

## 8. What to Validate Before Real Migration Files

Before converting this into actual Prisma migrations, confirm:

- enum strategy versus string strategy for controlled fields
- exact UUID or CUID choice for primary keys
- whether reminder configuration should remain JSON in MVP
- whether struggle areas remain compact JSON in onboarding preferences
- whether task repetition is needed in MVP or deferred
- whether reflections should exist independently from weekly reviews

## 9. Recommended Next Step

The strongest next step after this document is to translate this model into:

1. a first-pass Prisma schema
2. a phased migration set aligned with the milestone order
3. seeded development data for auth, tracking, and review flows

## 10. Final Recommendation

Use this ERD and migration plan as the implementation blueprint, but keep the first migration set disciplined. The product needs a clean, flexible schema, not an oversized speculative platform model.

