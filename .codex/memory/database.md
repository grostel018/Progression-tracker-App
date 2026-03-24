# Database

Source of truth: `DB/database.sql`

## Core Tables

- `users`: account records with `id`, `email`, `username`, `password_hash`, `created_at`
- `categories`: user-owned dream categories
- `dreams`: long-term items linked to categories and users
- `goals`: actionable items linked to dreams and users
- `goal_logs`: progress records linked to goals
- `streaks`: user streak counters
- `achievements`: achievement catalog
- `user_achievements`: earned achievement join table
- `sessions`: session token storage

## Important Relationships

- `categories.user_id -> users.id`
- `dreams.user_id -> users.id`
- `dreams.category_id -> categories.id`
- `goals.user_id -> users.id`
- `goals.dream_id -> dreams.id`
- `goal_logs.goal_id -> goals.id`
- `streaks.user_id -> users.id`
- `user_achievements.user_id -> users.id`
- `user_achievements.achievement_id -> achievements.id`
- `sessions.user_id -> users.id`

## Schema Details That Matter

- `goals.start_date` is required.
- `goals.goal_reached` exists in SQL and should be preserved in goal-related updates.
- Most foreign keys cascade on delete.
- `categories` has `UNIQUE(user_id, name)`.

## Current Code Mismatch

The current SQL schema does not define `users.last_login`, but some code assumes it exists:

- `src/lib/Auth.php`
- `.claude/memory/database.md`

Any work touching authentication should either:

- add the column through a schema update, or
- remove the dependency consistently across auth code.
