# Database Guide

## Overview

The database schema is defined in `DB/database.sql`, and incremental changes are tracked in `DB/migrations/`. The schema is centered around users, their tracked dreams and goals, and the historical evidence of progress over time.

Default database name:

```text
progression_tracker
```

## Entity Relationships

At a high level:

- one user has many categories
- one category has many dreams
- one dream has many goals
- one goal has many tasks and habits
- one habit has many habit log rows
- goals and dreams both produce history entries and progress snapshots

## Core Tables

### `users`

Stores registered accounts.

Important columns:

- `email` unique
- `username` unique
- `password_hash`
- `created_at`

### `categories`

Top-level grouping owned by a user.

Important columns:

- `user_id`
- `name`

Constraints:

- unique pair: `(user_id, name)`

### `dreams`

Longer-horizon ambitions grouped under categories.

Important columns:

- `user_id`
- `category_id`
- `title`
- `description`
- `start_date`
- `estimated_finish_date`
- `current_progress_percent`
- `status`

Statuses:

- `active`
- `paused`
- `completed`
- `abandoned`

### `goals`

Concrete items attached to dreams.

Important columns:

- `user_id`
- `dream_id`
- `title`
- `description`
- `goal_type`
- `start_date`
- `estimated_finish_date`
- `current_progress_percent`
- `goal_reached`
- `status`

Goal types:

- `daily`
- `weekly`
- `monthly`
- `yearly`

Statuses:

- `active`
- `paused`
- `completed`
- `failed`

### `goal_tasks`

Checklist-style items under a goal.

Important columns:

- `goal_id`
- `title`
- `description`
- `sort_order`
- `is_completed`
- `completed_at`

### `goal_habits`

Repeatable actions under a goal.

Important columns:

- `goal_id`
- `title`
- `description`
- `sort_order`

### `goal_habit_logs`

Individual executions of a habit.

Important columns:

- `habit_id`
- `history_entry_id`
- `logged_on`
- `note`

### `history_entries`

The central activity and history table used for dashboard analytics and per-entity logs.

Important columns:

- `entity_type`: `goal` or `dream`
- `entity_id`
- `entry_type`
- `title`
- `content`
- `entry_date`
- `related_type`
- `related_id`

Entry types:

- `manual_log`
- `task_completion`
- `habit_action`
- `system_event`

Related types:

- `goal_task`
- `goal_habit`

### `progress_snapshots`

Captures point-in-time progress percentages for goals or dreams.

Important columns:

- `entity_type`
- `entity_id`
- `history_entry_id`
- `progress_percent`
- `snapshot_date`

This powers progress-series style analytics.

### `activity_logs`

Audit-style application events such as login, registration, and CRUD actions.

Important columns:

- `action`
- `target_type`
- `target_id`
- `details`
- `created_at`

### `password_reset_tokens`

Stores one-time password reset tokens.

Important columns:

- `user_id`
- `token_hash`
- `requested_ip`
- `user_agent`
- `expires_at`
- `used_at`

Notes:

- raw tokens are never stored
- only the SHA-256 hash is persisted
- active tokens are invalidated on password reset or when a new reset is requested

### `schema_migrations`

Tracks applied SQL migration filenames.

## Supporting Tables

### `achievements`

Achievement catalog.

### `user_achievements`

Join table connecting users to earned achievements.

### `streaks`

Tracks current and longest streak metadata.

### `sessions`

A legacy or future-facing session table exists in the schema, but the active runtime session implementation is file-based under `var/sessions`.

## Important Indexes

The schema includes indexes that support the main read paths:

- user and status indexes on dreams and goals
- entity and date indexes on history entries and progress snapshots
- goal and date indexes on task and habit data
- expiry and active-token indexes on password reset tokens

## Migration Workflow

When changing the schema:

1. Update `DB/database.sql`
2. Add a new file to `DB/migrations/`
3. Run `scripts/migrate.php up` against an existing environment
4. Keep the migration filename tracked in `schema_migrations`

This keeps fresh installs and existing installs aligned.

## Data Ownership Rules

Most runtime reads and writes are scoped by `user_id`. Controllers and repositories enforce that users may only access categories, dreams, goals, tasks, habits, logs, and history records they own.
