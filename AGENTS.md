# Progression Tracker App

A PHP/MySQL web application for tracking personal progress toward goals, dreams, and aspirations.

## Project Overview

- **Type:** PHP/MySQL web application
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** PHP 7.4+ with PDO
- **Database:** MySQL (progression_tracker schema)
- **Server:** Apache (XAMPP configuration)
- **UI Style:** Terminal-style (black background, green text)

## Key Files

| File | Purpose |
|------|---------|
| `public/index.php` | Main entry point |
| `public/login.php` | User login API |
| `public/register.php` | User registration API |
| `public/dashboard.php` | Main dashboard |
| `DB/database.sql` | Database schema |

## Quick Commands

- **Start XAMPP:** Start Apache and MySQL in XAMPP Control Panel
- **Access app:** `http://localhost/progression-tracker/`
- **Import DB:** Import `DB/database.sql` via phpMyAdmin

## Adding Features

When adding new features:

1. **API endpoints:** Add to `public/` directory
2. **Views:** Add to `public/` as standalone PHP files
3. **Database:** Update `DB/database.sql` and add migration

## Current State

- ✅ Authentication (login, register, logout)
- ❌ Dashboard (needs goals/dreams implementation)
- ❌ Password reset (frontend exists, no email sending)

## Development Notes

- Database config: localhost, root, empty password (XAMPP defaults)
- Passwords hashed with Argon2ID
- Session-based authentication
