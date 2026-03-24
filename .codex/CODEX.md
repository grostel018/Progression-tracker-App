# Progression Tracker App

Project-local Codex memory for faster, safer development.

## Purpose

Use this folder as the first stop before making changes. It captures the active app layer, schema reality, and workflow constraints so future sessions do not have to rediscover them.

## Working Rules

- Treat `src/` as the authoritative implementation layer for business logic, views, helpers, repositories, and source assets.
- Treat `public/` as the HTTP entry layer only. Most files there now just bootstrap and dispatch into `src/`.
- Treat `src/assets/` as the frontend source of truth. `public/assets/` is the served copy and must be synced after edits.
- Treat `home/`, `legacy/`, `public/*.html`, and `.codex/original-repo/` as legacy or reference-only unless the user explicitly asks to touch them.
- Check `DB/database.sql` before changing queries or assumptions about columns and tables.
- Use `DB/migrations/20260324_progress_history_analytics.sql` only when reasoning about upgrading an older database; the main schema already includes those tables.
- Update `.codex/memory/*.md` when architecture, schema, or workflow assumptions change.
- Append notable task outcomes to `.codex/logbook.md` when a change affects future work.

## Fast Orientation

- Public root redirect: `public/index.php`
- Auth pages: `public/login.php`, `public/register.php`, `public/forgot.php`
- Dashboard pages: `public/dashboard.php`, `public/dreams.php`, `public/goals.php`, `public/categories.php`, `public/logs.php`
- Shared bootstrap: `src/bootstrap.php`
- Shared helpers/auth/db: `src/lib/helpers.php`, `src/lib/Auth.php`, `src/lib/Database.php`
- Source views: `src/views/`
- Source assets: `src/assets/`
- Served assets: `public/assets/`
- Database schema: `DB/database.sql`
- Asset sync script: `scripts/sync-assets.php`

## Current Repo Reality

- This folder is a Git working tree.
- There is no Composer setup, package manager manifest, or automated test runner in the repo.
- The app is a server-rendered PHP application with JS-enhanced interactions, not a SPA.
- `src/bootstrap.php` provides the autoloader and wires root `config/` correctly.
- The app now includes history/progress analytics, goal tasks, goal habits, and security-question-based password reset flows.

Read these next:

- `.codex/memory/architecture.md`
- `.codex/memory/database.md`
- `.codex/memory/workflow.md`
- `.codex/memory/known-issues.md`
