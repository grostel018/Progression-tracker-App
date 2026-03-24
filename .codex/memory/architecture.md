# Architecture

## Top-Level Structure

- `public/`: active standalone PHP pages and AJAX-style endpoints.
- `src/`: newer namespaced controllers, repositories, helpers, assets, and views.
- `config/`: root application and database configuration.
- `DB/`: canonical SQL schema.
- `home/`: older duplicate frontend/backend area, likely superseded by `public/`.
- `.claude/`: prior agent memory that can help, but should not be treated as fully current.

## Request Flow In Practice

The working app currently appears to rely on direct `public/*.php` files:

- `public/index.php` renders the login page directly.
- `public/login.php` performs login with inline PDO setup.
- `public/dashboard.php` reads from `$_SESSION` directly and renders a simple dashboard.
- `public/dreams.php`, `public/goals.php`, `public/categories.php`, and `public/logs.php` are likely the current dashboard subpages.

## Refactor Layer Status

The `src/` layer suggests a cleaner architecture:

- `src/lib/Database.php`: singleton PDO wrapper.
- `src/lib/Auth.php`: authentication/session manager.
- `src/api/*`: handlers/controllers/repositories by domain.
- `src/views/*`: view templates for auth and dashboard.

This layer is not fully bootstrapped yet. Several files assume shared helpers, config loading, database initialization, or routes that are not visibly connected end-to-end.

## Guidance For Future Changes

- If fixing the live app quickly, start in `public/`.
- If doing structural cleanup, decide explicitly whether the goal is:
  - stabilize the current `public/` flow, or
  - finish migrating to the `src/` layer.
- Avoid mixing both layers in one feature unless the task is a deliberate migration.

## UI Notes

- The project uses a terminal-style aesthetic: black background, green accents, minimal chrome.
- Shared styles currently exist in both `public/style.css` and `src/assets/css/*`.
- Shared scripts currently exist in both `public/script.js` and `src/assets/js/*`.
