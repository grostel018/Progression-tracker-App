# Known Issues

These are current repo-level hazards that should be checked before deep work.

## Configuration Loading Bug

`src/lib/helpers.php` loads config from `__DIR__ . '/../config/'`.

Given the actual repo layout, that resolves to `src/config/`, but the config files live in root `config/`.

Impact:

- `config('database')` and `config('app')` can silently fail in the `src/` layer.

## Auth Schema Mismatch

`src/lib/Auth.php` reads or writes `users.last_login`, but `DB/database.sql` does not create that column.

Impact:

- login and registration logic in the refactor layer can fail against a clean database.

## Incomplete `src/` Bootstrapping

The newer view/controller layer is not fully wired:

- `src/views/dashboard/index.php` uses `Database::getConnection()` without visibly requiring `Database.php`
- the same file links to asset paths that are unlikely to resolve if served directly
- logout links in `src/views/*` do not match the handler files present in `src/api/auth/`

Impact:

- direct use of `src/views/*` is likely broken without additional bootstrap work

## Parallel App Copies

There are at least three application areas:

- `public/`
- `src/`
- `home/`

Impact:

- features and fixes can diverge unless the active layer is chosen intentionally

## Stale Reference Material

`README.md` and `.claude/` describe the project helpfully, but parts of them no longer match the exact repo state.

Impact:

- use them as orientation, then verify against actual files before changing behavior
