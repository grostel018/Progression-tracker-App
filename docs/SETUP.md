# Setup Guide

This guide covers the supported ways to run the project locally and explains the configuration files, migrations, assets, and test workflow.

## Prerequisites

### Local/XAMPP workflow

- PHP installed through XAMPP
- Apache
- MySQL
- A browser

### Docker workflow

- Docker Desktop or a compatible Docker installation

## Configuration Files

The project loads config in this order:

1. `config/database.php`
2. `config/database.local.php` if present
3. `config/app.php`
4. `config/app.local.php` if present

Local files are merged over the committed defaults, so local machine settings do not have to be committed.

### Database config

Base config: `config/database.php`

Typical local override file:

```php
<?php

return [
    'host' => '127.0.0.1',
    'port' => 3306,
    'dbname' => 'progression_tracker',
    'user' => 'root',
    'pass' => '',
];
```

Template: `config/database.local.php.example`

### App config

Base config: `config/app.php`

Important settings:

- `app_url`: used when generating password reset links
- `timezone`: defaults to `UTC`
- `mail.transport`: `log` in development, `mail` in production by default
- `password.min_length`: currently `10`
- `session.*`: cookie name, lifetime, same-site, secure mode, and related flags

Template: `config/app.local.php.example`

## Local Setup with XAMPP

1. Start Apache and MySQL in XAMPP.
2. Create a database named `progression_tracker`.
3. Import `DB/database.sql` with phpMyAdmin or the MySQL CLI.
4. Ensure Apache serves the repository's `public/` directory as the document root.
5. If your URL is not `http://localhost`, create `config/app.local.php` and set `app_url` correctly.
6. Ensure PHP can write to `var/`.

Expected writable runtime paths:

- `var/sessions`
- `var/rate-limits`
- `var/logs`

## Docker Setup

Start the stack:

```bash
docker compose up --build
```

Services provided by `docker-compose.yml`:

- `app`: PHP 8.2 + Apache, document root set to `public/`
- `db`: MySQL 8.0

Default Docker access:

- App URL: `http://localhost:8080`
- MySQL host: `127.0.0.1`
- MySQL port: `3307`
- Database: `progression_tracker`
- User: `progression_user`
- Password: `progression_pass`

The initial schema from `DB/database.sql` is imported automatically the first time the database volume is created.

### Resetting the Docker database

```bash
docker compose down -v
docker compose up --build
```

## Database Migrations

The repository keeps:

- `DB/database.sql` as the current full schema
- `DB/migrations/` for incremental SQL changes

Migration commands:

```powershell
C:\xampp\php\php.exe scripts\migrate.php status
C:\xampp\php\php.exe scripts\migrate.php up
C:\xampp\php\php.exe scripts\migrate.php baseline-current
```

Composer aliases:

```bash
composer migrate:status
composer migrate:up
composer migrate:baseline
```

Use `baseline-current` when the database already matches the current schema and you only need to mark existing migration files as applied.

## Assets

Frontend assets live in two places:

- `src/assets/` contains the editable source files
- `public/assets/` contains the served copies

Sync commands:

```powershell
C:\xampp\php\php.exe scripts\sync-assets.php
C:\xampp\php\php.exe scripts\sync-assets.php --check
```

Composer aliases:

```bash
composer assets:sync
composer assets:check
```

`--check` exits with a non-zero status when `public/assets/` is out of sync.

## Tests

The project uses a lightweight custom PHP test runner in `tests/run.php`.

Run tests with:

```powershell
C:\xampp\php\php.exe tests\run.php
```

Or:

```bash
composer test
```

Current coverage focuses on:

- auth handlers
- configuration loading
- migration management
- rate limiting

## Password Reset Behavior

In development, password reset emails do not have to be sent through SMTP. When `MAIL_TRANSPORT=log`, reset links are written to:

```text
var/logs/password-reset.log
```

This is the easiest way to verify the forgot/reset flow locally.

## Troubleshooting

### The app redirects to login unexpectedly

- Confirm PHP can write to `var/sessions`
- Verify the browser accepts cookies
- Check whether `SESSION_SECURE` or HTTPS assumptions conflict with your local URL

### API POST/PUT/DELETE requests return a token mismatch

- The app enforces CSRF validation for state-changing requests
- Include the session token as either `_csrf` in the body or `X-CSRF-Token` in the request headers

### Password reset link points to the wrong host

- Set `app_url` in `config/app.local.php`

### Frontend changes are not visible

- Re-sync assets from `src/assets/` to `public/assets/`
- Hard refresh the browser after asset sync

### Migration state looks wrong

- Run `scripts/migrate.php status`
- If the schema is already current but migrations were never recorded, use `baseline-current`
