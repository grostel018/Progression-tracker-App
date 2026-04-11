# Architecture Guide

## Application Style

The application is a server-rendered PHP web app with JavaScript enhancements. It is not a single-page application and does not use a heavy framework. Each HTTP request starts from a PHP entry point in `public/`, bootstraps shared infrastructure, and then either renders a PHP view or returns JSON.

## High-Level Layers

### `public/`

This is the web root and the only directory that should be exposed by Apache. It contains:

- page entry points such as `dashboard.php`, `goals.php`, and `dreams.php`
- auth pages such as `login.php` and `forgot.php`
- API endpoints under `public/api/`
- static assets under `public/assets/`

These files are intentionally thin. They should bootstrap the application, enforce auth or CSRF rules, and delegate to the relevant handler/controller.

### `src/`

This holds application logic and presentation code.

- `src/bootstrap.php`: autoloading, helpers, timezone, and session-path setup
- `src/lib/`: shared infrastructure such as auth, database, config loading, migration management, rate limiting, and helpers
- `src/api/`: feature-specific controllers, handlers, repositories, and services
- `src/views/`: PHP templates for server-rendered pages
- `src/assets/`: source CSS and JavaScript

### `config/`

Configuration is split into committed base files and optional local overrides:

- `app.php` and `app.local.php`
- `database.php` and `database.local.php`

### `DB/`

- `database.sql`: full schema
- `migrations/`: incremental changes tracked through `schema_migrations`

### `var/`

Runtime storage for:

- PHP sessions
- file-backed rate limit records
- password reset mail logs

## Request Lifecycle

### Page request flow

Example: `GET /dashboard.php`

1. `public/dashboard.php` requires `src/bootstrap.php`
2. The database is booted with `boot_database()`
3. The current user is required with `require_auth_user()`
4. A repository is asked for page data
5. `view()` renders a PHP template from `src/views/`
6. The browser receives HTML plus linked CSS/JS from `public/assets/`

### API request flow

Example: `POST /api/goals.php`

1. `public/api/goals.php` requires `src/bootstrap.php`
2. `boot_api()` starts the session, boots the database, and validates CSRF for state-changing methods
3. The endpoint delegates to a controller or handler from the app container
4. The controller validates ownership and required fields
5. A repository writes to or reads from MySQL
6. A JSON response is returned

## Dependency Wiring

The project uses a lightweight service container in `src/lib/AppContainer.php`.

It centralizes creation of:

- shared PDO connection
- auth manager
- auth handlers
- repositories
- controllers
- tracking/history services

This avoids repeatedly instantiating complex object graphs inside entry points and makes tests simpler.

## Data Access Pattern

Repositories own SQL access for a feature area. Examples:

- `CategoryRepository`
- `DreamRepository`
- `GoalRepository`
- `HistoryRepository`
- `ActivityLogRepository`

Controllers and services depend on repositories rather than mixing SQL directly into page handlers.

## Services vs Controllers

Use controllers and handlers for request orchestration:

- validate inputs
- enforce auth and ownership
- decide response payload shape

Use services for multi-step domain behavior:

- `GoalTrackingService` coordinates tasks, habits, habit logs, and related history
- `HistoryService` builds heatmaps, weekly reviews, summaries, and manual log creation

## Authentication and Sessions

Auth is handled by `src/lib/Auth.php`.

Important behavior:

- session-based login with PHP sessions
- session cookies are configured from `config/app.php`
- unauthenticated page requests redirect to `login.php`
- unauthenticated API requests return `401` JSON
- passwords are hashed with Argon2ID
- password rehashing is automatic on login when needed

## CSRF Protection

State-changing requests use `require_csrf_token()` through `boot_api()`.

Accepted CSRF token sources:

- request body field: `_csrf`
- request header: `X-CSRF-Token`

GET requests are not subject to CSRF checks. POST, PUT, PATCH, and DELETE are.

## Rate Limiting

`src/lib/RateLimiter.php` provides lightweight file-backed throttling stored in `var/rate-limits`.

Current notable limits:

- login attempts: 10 per 15 minutes by IP and by email hash
- forgot-password attempts: 5 per 15 minutes by IP and by email hash
- reset-password attempts: 5 per 15 minutes by IP and per token hash key

## Frontend Asset Model

- Edit source files in `src/assets/`
- Serve files from `public/assets/`
- Run `scripts/sync-assets.php` after frontend changes

This project intentionally keeps the asset pipeline simple and repository-local instead of introducing a Node-based build chain.

## Feature Areas

### Authentication

- Views: `src/views/auth/`
- Endpoints: `public/api/auth/`
- Handlers: `src/api/auth/`

### Dashboard and page rendering

- Page entry points: `public/*.php`
- Views: `src/views/dashboard/`
- Shared layout partials: `src/views/partials/`

### Goals, dreams, and categories

- Endpoints: `public/api/goals.php`, `public/api/dreams.php`, `public/api/categories.php`
- Controllers: `src/api/goals/GoalController.php`, `src/api/dreams/DreamController.php`, `src/api/categories/CategoryController.php`
- Repositories: matching repository classes in each feature directory

### History and analytics

- Endpoint: `public/api/history.php`
- Service: `src/api/history/HistoryService.php`
- Repository: `src/api/history/HistoryRepository.php`

## Adding a New Feature

The current project structure works best when new features follow this pattern:

1. Add or update schema in `DB/database.sql`
2. Add a migration file in `DB/migrations/`
3. Create repository methods in `src/api/<feature>/`
4. Add a controller or handler if the feature exposes an API
5. Add or update a page entry point in `public/` if a new page is needed
6. Add the PHP view under `src/views/`
7. Add frontend behavior in `src/assets/` and sync to `public/assets/`
8. Add tests in `tests/` when behavior is non-trivial

## Archived Material

The `archive/` directory contains historical snapshots and preserved experiments. Treat the repository root as the active application and `archive/` as reference-only material unless you are intentionally recovering older work.
