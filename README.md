# Progression Tracker App

A PHP/MySQL web application for tracking dreams, goals, and progress logs.

## Features

- User authentication with register, login, logout, and recovery flows
- Dream, goal, category, and activity-log management
- Session-based authentication
- Terminal-inspired UI

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: PHP 7.4+ with PDO
- Database: MySQL
- Server: Apache via XAMPP

## Active Structure

```text
Progression tracker app/
├── public/                   # Web root
│   ├── index.php            # Redirects to login or dashboard
│   ├── login.php            # Auth page entry
│   ├── register.php
│   ├── forgot.php
│   ├── dashboard.php
│   ├── dreams.php
│   ├── goals.php
│   ├── categories.php
│   ├── logs.php
│   ├── logout.php
│   ├── api/                 # HTTP endpoints
│   ├── assets/              # Served CSS/JS copies
│   ├── login.html           # Legacy redirect shim
│   ├── register.html        # Legacy redirect shim
│   ├── forgot.html          # Legacy redirect shim
│   └── session_check.php    # Compatibility endpoint
├── src/
│   ├── bootstrap.php        # App bootstrap + autoload
│   ├── lib/                 # Shared utilities and auth/database classes
│   ├── api/                 # Controllers, handlers, repositories
│   ├── views/               # PHP views and partials
│   └── assets/              # Source CSS/JS
├── config/                  # App and DB config
├── DB/                      # SQL schema
├── design/                  # Figma/tokens reference files
├── legacy/                  # Archived prototype files, not active runtime
├── scripts/                 # Small maintenance scripts
└── var/                     # Writable runtime state such as sessions
```

## Notes

- `src/` is the source of truth for application code.
- `public/assets/` contains the copies served by Apache.
- Run `C:\xampp\php\php.exe scripts/sync-assets.php` after changing files in `src/assets/`.
- Dynamic PHP pages and JSON endpoints send no-store cache headers, while versioned assets are configured for long-lived browser caching.
- `legacy/` holds the older standalone prototype and unused root-level public assets that were removed from the active structure.
- The root-level `.html` auth files in `public/` remain only to redirect old links to the PHP routes.
- See `CHANGELOG.md` for the recent UI, interaction, session, and caching improvements.

## Installation

1. Copy the project into your server directory.
2. Import `DB/database.sql`.
3. Configure database credentials in `config/database.php`.
4. Point Apache to the `public/` directory as the web root.
5. Open the app through your configured local URL.

## Security

- Argon2ID password hashing
- Prepared statements with PDO
- Session-based auth guards
- Output escaping helpers
