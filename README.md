# Progression Tracker App

Progression Tracker is a server-rendered PHP/MySQL application for tracking dreams, goals, categories, habits, task completions, and activity history. The UI is rendered with PHP views, while vanilla JavaScript enhances forms, dashboard interactions, and authenticated API calls.

## What the app does

- User registration, login, logout, and password reset
- Category management for organizing higher-level ambitions
- Dream management with status and progress tracking
- Goal management under dreams
- Goal task and habit tracking
- Manual history logging plus progress snapshots
- Activity and audit logging with weekly review analytics

## Stack

- PHP with PDO
- MySQL
- Apache/XAMPP for local development
- Docker for containerized development
- Vanilla JavaScript, HTML, and CSS
- Session-based authentication

## Documentation Map

- [Setup Guide](docs/SETUP.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Database Guide](docs/DATABASE.md)
- [Changelog](CHANGELOG.md)

## Quick Start

### XAMPP / local Apache

1. Start Apache and MySQL in XAMPP.
2. Create `config/database.local.php` from `config/database.local.php.example` if you want local database overrides.
3. Optionally create `config/app.local.php` from `config/app.local.php.example` to override the base app URL.
4. Import `DB/database.sql` into a MySQL database named `progression_tracker`.
5. Point Apache at this repository's `public/` directory.
6. Open your configured local URL.

### Docker

```bash
docker compose up --build
```

The Docker stack serves the app at `http://localhost:8080` and MySQL on `localhost:3307`.

## Common Commands

```bash
composer test
composer assets:check
composer assets:sync
composer migrate:status
composer migrate:up
composer migrate:baseline
```

If Composer is not available, use the bundled PHP scripts directly:

```powershell
C:\xampp\php\php.exe tests\run.php
C:\xampp\php\php.exe scripts\sync-assets.php --check
C:\xampp\php\php.exe scripts\sync-assets.php
C:\xampp\php\php.exe scripts\migrate.php status
C:\xampp\php\php.exe scripts\migrate.php up
```

## Project Layout

```text
config/          App and database config, plus optional local overrides
DB/              Full schema and incremental SQL migrations
docs/            Project documentation
public/          Web root, page entry points, and API endpoints
scripts/         Asset sync and migration scripts
src/             Application code, views, repositories, services, and assets
tests/           Lightweight custom PHP test harness
var/             Runtime files such as sessions, rate limits, and mail logs
archive/         Historical copies and preserved prototypes
```

## Runtime Notes

- `src/assets/` is the source of truth for frontend assets.
- `public/assets/` contains the browser-served copies and should be kept in sync.
- Sessions are file-backed in `var/sessions`.
- Rate limiting is file-backed in `var/rate-limits`.
- Password reset links are logged to `var/logs/password-reset.log` when `MAIL_TRANSPORT=log`.
- Stateful API requests require a valid CSRF token.

## Architecture in One Sentence

Thin `public/` entry points bootstrap the app, enforce session and CSRF behavior, delegate to controllers or handlers in `src/`, and then render PHP views or JSON responses backed by repository-based data access.
