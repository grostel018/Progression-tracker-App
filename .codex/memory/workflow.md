# Workflow

## Local Development Assumptions

- Intended stack: PHP + MySQL, likely under XAMPP/Apache.
- `README.md` points to an Apache/XAMPP setup.
- `config/app.php` defaults `app_url` to `http://localhost:8000`, so some work may also target PHP's built-in server.

## Practical Start Points

- Database import: `DB/database.sql`
- App config: `config/app.php`
- DB config: `config/database.php`
- Public entry page: `public/index.php`

## Verification Strategy

No automated test suite or package scripts were found, so default to targeted manual checks:

- auth flow: login, register, logout
- session-protected navigation: dashboard and child pages
- CRUD flows: categories, dreams, goals, logs
- DB-backed changes: verify against actual schema, not only PHP assumptions

## Debugging Notes

- PHP errors are likely easiest to inspect through Apache/XAMPP logs if running under XAMPP.
- Existing debugging guidance in `.claude/memory/debugging.md` is still useful for environment-level checks.
- If a change touches `src/`, verify that required files are loaded explicitly because no autoloader was found.

## Change Discipline

- Before editing, identify which layer is authoritative for the task: `public/`, `src/`, or `home/`.
- When fixing a bug in the live app, do not automatically mirror the change into `src/` and `home/`.
- When making structural fixes, record the decision in `.codex/logbook.md`.
