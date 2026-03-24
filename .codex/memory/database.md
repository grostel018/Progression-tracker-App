# Database

Source of truth: `DB/database.sql`

Upgrade helper for older installs: `DB/migrations/20260324_progress_history_analytics.sql`

Backup snapshot before history upgrade: `DB/backups/progression_tracker_pre_history_20260324.sql`

## Core Tables

- `users`: account records with `email`, `username`, `password_hash`, `created_at`.
- `categories`: user-owned grouping layer for dreams.
- `dreams`: long-range items with category link, status, and `current_progress_percent`.
- `goals`: dream-linked execution items with `goal_type`, status, `goal_reached`, and `current_progress_percent`.
- `history_entries`: dated timeline records for goal/dream activity.
- `progress_snapshots`: explicit progress values over time for goals/dreams.
- `goal_tasks`: actionable goal sub-items with completion state.
- `goal_habits`: repeatable goal-linked actions.
- `goal_habit_logs`: dated habit action records, optionally linked back to a history entry.
- `activity_logs`: audit trail for auth and CRUD-style actions.
- `streaks`: per-user streak counters.
- `achievements`: achievement catalog.
- `user_achievements`: earned-achievement join table.
- `sessions`: standalone session-token table that exists in schema but is not used by current runtime auth.
- `security_questions`: selectable recovery questions.
- `user_security_answers`: per-user hashed answers for password recovery.

## Relationships That Matter

- `categories.user_id -> users.id`
- `dreams.user_id -> users.id`
- `dreams.category_id -> categories.id`
- `goals.user_id -> users.id`
- `goals.dream_id -> dreams.id`
- `history_entries.user_id -> users.id`
- `progress_snapshots.history_entry_id -> history_entries.id`
- `goal_tasks.goal_id -> goals.id`
- `goal_habits.goal_id -> goals.id`
- `goal_habit_logs.habit_id -> goal_habits.id`
- `goal_habit_logs.history_entry_id -> history_entries.id`
- `activity_logs.user_id -> users.id`
- `user_security_answers.user_id -> users.id`
- `user_security_answers.question_id -> security_questions.id`

Most user-owned records cascade on delete.

## Schema Details That Affect Code

- `goals.start_date` is required.
- `dreams.start_date` is nullable, but current create logic defaults it to today when omitted.
- `goals.goal_reached` still exists in schema, but most newer flows use `status`, `current_progress_percent`, and history data.
- `history_entries.entry_type` is one of `manual_log`, `task_completion`, `habit_action`, `system_event`.
- `history_entries.related_type` can point to `goal_task` or `goal_habit`.
- `progress_snapshots` stores percent history separately from the current percent columns on `goals` and `dreams`.
- `categories` has `UNIQUE(user_id, name)`.
- `user_security_answers` has `UNIQUE(user_id, question_id)`.

## Current Runtime Assumptions

- Auth uses PHP sessions stored under `var/sessions/`, not the `sessions` SQL table.
- Password reset is based on security-question verification and temporary session state.
- Existing users need rows in `user_security_answers` to use the reset flow.
- Goal and dream history pages depend on `history_entries` and `progress_snapshots` being present.

## Verified Mismatch Notes

- The older memory note about `users.last_login` is stale. The current `src/lib/Auth.php` no longer queries or updates `last_login`.
