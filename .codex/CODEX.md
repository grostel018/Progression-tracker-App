# Progression Tracker App

Project-local Codex memory for faster, safer development.

## Purpose

Use this folder as the first stop before making changes. It captures the current repo shape, known hazards, and a lightweight log of important work so future sessions do not have to rediscover the same constraints.

## Working Rules

- Treat `public/` as the active entry layer unless the task is explicitly about the newer `src/` architecture.
- Treat `src/` as an in-progress refactor, not a fully wired application.
- Treat `home/` as legacy or duplicate UI/backend code unless the user asks to keep it in sync.
- Keep the terminal-style visual language unless the task is explicitly a redesign.
- Check `DB/database.sql` before trusting model/controller assumptions about available columns.
- Prefer root `config/` as the intended configuration source.
- Update `.codex/memory/*.md` when architecture, schema, or workflow assumptions change.
- Append notable task outcomes to `.codex/logbook.md` when a change affects future work.

## Fast Orientation

- Public login page: `public/index.php`
- Public auth endpoint: `public/login.php`
- Main dashboard entry: `public/dashboard.php`
- Shared config: `config/app.php`, `config/database.php`
- Database schema: `DB/database.sql`
- Newer namespaced layer: `src/api`, `src/lib`, `src/views`
- Existing Claude memory: `.claude/`

## Current Repo Reality

- No Composer setup or visible autoloader was found.
- No test runner or project scripts were found.
- The repo is not currently a Git working tree in this folder.
- Documentation in `README.md` and `.claude/` is useful, but some details are stale against the current code.

Read these next:

- `.codex/memory/architecture.md`
- `.codex/memory/database.md`
- `.codex/memory/workflow.md`
- `.codex/memory/known-issues.md`
