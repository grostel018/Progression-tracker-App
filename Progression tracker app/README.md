# Progression Tracker App

A PHP/MySQL web application for tracking personal progress toward goals, dreams, and aspirations.

## Features

- User authentication (login, register, logout)
- Dream management (long-term goals with categories)
- Goal tracking (daily, weekly, monthly, yearly goals)
- Activity logging
- Session-based authentication
- Terminal-style UI

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** PHP 7.4+ (using PDO for database access)
- **Database:** MySQL (progression_tracker schema)
- **Server:** Apache (XAMPP configuration)

## Project Structure

```
Progression tracker app/
├── public/                   # Web root (entry point)
│   ├── index.php            # Router/entry point
│   ├── login.html
│   ├── register.html
│   ├── forgot.html
│   └── dashboard.php        # Main app entry (session protected)
│
├── src/
│   ├── views/
│   │   ├── auth/
│   │   │   ├── login.php
│   │   │   ├── register.php
│   │   │   └── forgot.php
│   │   └── dashboard/
│   │       ├── index.php        # Main dashboard
│   │       ├── dreams.php
│   │       ├── goals.php
│   │       ├── categories.php
│   │       └── logs.php
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── LoginHandler.php
│   │   │   ├── RegisterHandler.php
│   │   │   ├── LogoutHandler.php
│   │   │   └── SessionManager.php
│   │   ├── goals/
│   │   │   ├── GoalController.php
│   │   │   ├── GoalRepository.php
│   │   │   └── GoalLogController.php
│   │   └── dreams/
│   │       └── DreamController.php
│   │
│   ├── lib/
│   │   ├── Database.php         # PDO wrapper
│   │   ├── Auth.php             # Auth guard middleware
│   │   ├── Validator.php
│   │   └── helpers.php          # Utility functions
│   │
│   └── assets/
│       ├── css/
│       │   └── style.css
│       ├── js/
│       │   ├── app.js           # Main app bundle
│       │   ├── auth.js          # Auth-specific JS
│       │   └── dashboard.js     # Dashboard logic
│       └── img/                 # Icons, assets
│
├── config/
│   ├── database.php
│   └── app.php
│
└── DB/
    └── database.sql
```

## Installation

1. Copy the project to your web server directory (e.g., `htdocs` for XAMPP)
2. Import the database schema from `DB/database.sql`
3. Configure database credentials in `config/database.php`
4. Set up Apache virtual host pointing to `public/` directory
5. Access the application at your configured URL

### Default Database Configuration

```php
$host = "localhost";
$dbname = "progression_tracker";
$user = "root";
$pass = "";
```

## Usage

1. **Register** a new account
2. **Create categories** to organize your dreams
3. **Create dreams** (long-term goals)
4. **Create goals** for each dream
5. **Track progress** by updating goal logs

## Security Features

- Password hashing using Argon2ID
- SQL prepared statements for injection protection
- Session-based authentication
- XSS protection via input sanitization

## License

Copyright 2026 Rostel Ebele GENI NDOUDI. All rights reserved.
