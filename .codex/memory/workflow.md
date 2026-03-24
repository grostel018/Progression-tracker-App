# Workflow

## Local Development Assumptions

- Intended stack: PHP + MySQL, typically under XAMPP/Apache.
- Current workspace path is under `C:\xampp\htdocs\...`, so Apache/XAMPP is the most likely runtime.
- `config/app.php` still defaults `app_url` to `http://localhost:8000`, which is useful for PHP built-in-server work but not proof of the primary runtime.

## Practical Start Points

- Schema import / reset: `DB/database.sql`
- App config: `config/app.php`
- DB config: `config/database.php`
- Public entry: `public/index.php`
- Shared bootstrap: `src/bootstrap.php`
- Shared dashboard shell: `src/views/partials/dashboard-start.php`

## Authoritative Edit Targets

- Business logic and data access: `src/api/*`, `src/lib/*`
- Page markup: `src/views/*`
- Frontend source: `src/assets/*`
- Served frontend output: `public/assets/*` only after syncing
- HTTP route wiring: `public/*.php`, `public/api/*.php`

Do not start in `home/`, `legacy/`, or `public/*.html` unless the user explicitly asks for those areas.

## Asset Workflow

- Edit files in `src/assets/`.
- Sync to `public/assets/` with:
  - `C:\xampp\php\php.exe scripts/sync-assets.php`
- Avoid treating `public/assets/` as the source of truth because it can drift or be overwritten by sync.

## Verification Strategy

There is no automated test suite in the repo, so default to targeted verification:

- `php -l` on touched PHP files
- run the asset sync script after frontend asset edits
- manual auth checks: login, register, logout, forgot password
- manual CRUD checks: categories, dreams, goals
- manual history checks: dashboard history, goal history, dream history, manual log creation, task completion, habit action logging

## Debugging Notes

- API endpoints consistently return JSON through helper functions in `src/lib/helpers.php`.
- A `401` from frontend fetch calls usually redirects the browser to `login.php` via `src/assets/js/app.js`.
- If a page looks stale after a frontend change, check whether `src/assets/` was synced to `public/assets/`.
- If auth/session behavior is inconsistent, inspect `var/sessions/` permissions and the session cookie config in `config/app.php`.

## Default Mental Model

When debugging or implementing a feature, trace in this order:

1. `public/*.php` or `public/api/*.php`
2. `src/bootstrap.php` / helpers / auth
3. `src/api/*` controller or handler
4. repository/database interactions
5. `src/views/*`
6. `src/assets/*`
7. synced `public/assets/*`
