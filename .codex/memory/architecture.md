# Architecture

## Top-Level Structure

- `public/`: thin PHP entrypoints for pages and APIs.
- `src/`: active application code.
- `config/`: root config loaded by helpers/bootstrap.
- `DB/`: canonical schema, migrations, and backups.
- `scripts/`: utility scripts, currently asset syncing.
- `home/`, `legacy/`, `.codex/original-repo/`: older copies or reference material, not the live app.

## Active Request Flow

The current live flow is:

1. `public/*.php` or `public/api/*.php` receives the request.
2. The file requires `src/bootstrap.php`.
3. Bootstrap registers the `src\` autoloader, loads helpers, config, timezone, and session storage.
4. Page routes call repositories and render `src/views/*`.
5. API routes dispatch into `src/api/*` controllers/handlers and return JSON.

Examples:

- `public/dashboard.php` -> `src\api\dashboard\DashboardRepository` -> `src/views/dashboard/index.php`
- `public/api/goals.php` -> `src\api\goals\GoalController`
- `public/api/history.php` -> `src\api\history\HistoryController`
- `public/api/auth/login.php` -> `src\api\auth\LoginHandler`

## Core Layers

### `src/bootstrap.php`

- Defines `BASE_PATH` and `SRC_PATH`.
- Registers a simple `src\` namespace autoloader.
- Loads `src/lib/helpers.php`.
- Sets timezone from `config/app.php`.
- Ensures `var/sessions/` exists and is used for PHP session storage.

### `src/lib/`

- `helpers.php`: config loading, view rendering, redirects, request parsing, JSON responses, session bootstrapping, asset versioning.
- `Database.php`: singleton PDO connection via `Database::init()` and `Database::getConnection()`.
- `Auth.php`: session-backed auth, login/logout/register, current-user lookup, auth guards, security-question helpers.

### `src/api/`

Main active domains:

- `auth/`: login, register, forgot password, reset password, session check, security questions.
- `dashboard/`: dashboard stats.
- `categories/`: category CRUD.
- `dreams/`: dream CRUD.
- `goals/`: goal CRUD, manual goal logs, goal tasks, goal habits, habit-action logging.
- `history/`: dashboard/entity analytics, heatmap/trend data, manual history entries.
- `logs/`: audit-style activity logs.
- `achievements/`: read earned achievements.

### `src/views/`

- `auth/`: server-rendered login, register, and forgot-password pages.
- `dashboard/`: dashboard, dreams, goals, categories, logs.
- `partials/`: shared dashboard shell and modal markup.

The dashboard views are already wired and should be treated as live, not as an incomplete migration.

### Frontend Assets

- Source files live in `src/assets/css/*` and `src/assets/js/*`.
- Served copies live in `public/assets/*`.
- `asset_url()` appends filemtime-based cache-busting query strings.
- `scripts/sync-assets.php` copies changed asset files from `src/assets/` to `public/assets/`.

## Page Model

- Auth pages are guest-only and post to JSON auth endpoints.
- Dashboard pages are server-rendered and authenticated.
- Interactivity is added per page with JS modules:
  - `app.js`: shared fetch/helpers/UI actions.
  - `auth.js`: auth forms and password recovery flow.
  - `dashboard.js`: dashboard page behaviors.
  - `dreams.js`, `goals.js`, `categories.js`, `logs.js`, `history.js`: page/domain behavior.

## History / Progress Model

Recent architecture additions made history first-class:

- `history_entries`: canonical activity timeline for dreams/goals.
- `progress_snapshots`: explicit percent snapshots for charts/trends.
- `goal_tasks`: concrete goal sub-items with completion tracking.
- `goal_habits`: repeatable goal actions.
- `goal_habit_logs`: dated habit-action records.

Task completions and habit actions feed history automatically. Manual history entries can also update current progress on goals/dreams.

## What To Ignore By Default

- `public/login.html`, `public/register.html`, `public/forgot.html`: static leftovers, not the active auth flow.
- `home/`: older standalone prototype area.
- `legacy/`: archived assets/prototypes.
- `.codex/original-repo/`: preserved snapshot/reference copy.
