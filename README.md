


# Progression Tracker App

A PHP/MySQL web application for tracking personal progress across dreams, goals, categories, and activity logs.

This project is built as a **server-rendered PHP application with JavaScript enhancements**. It is **not** a full SPA. Pages are rendered on the server using PHP views, while frontend JavaScript improves the user experience through form validation and API-based interactions.

---

## Features

- User authentication
  - Register
  - Login
  - Logout
  - Forgot password flow
- Dashboard for viewing progress
- Goal management
- Dream management
- Category management
- Activity log tracking
- Session-based authentication
- API endpoints for dashboard interactions
- Frontend validation for auth forms
- Modular structure with shared bootstrap, auth, helpers, and repositories

---

## Tech Stack

- **Backend:** PHP
- **Database:** MySQL
- **Database Access:** PDO
- **Frontend:** HTML, CSS, JavaScript
- **Architecture Style:** Server-rendered PHP + JS enhancements

---

## Project Structure

```text
Progression Tracker App/
│
├── public/                      # Web root / HTTP entry points
│   ├── index.php
│   ├── login.php
│   ├── register.php
│   ├── forgot.php
│   ├── dashboard.php
│   ├── dreams.php
│   ├── goals.php
│   ├── categories.php
│   ├── logs.php
│   ├── logout.php
│   │
│   └── api/                     # API entry points
│       ├── auth/
│       │   ├── login.php
│       │   ├── register.php
│       │   └── forgot.php
│       ├── goals.php
│       ├── dreams.php
│       ├── categories.php
│       ├── logs.php
│       └── session.php
│
├── src/                         # Application source code
│   ├── bootstrap.php            # Shared app bootstrapping
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── AuthInputValidator.php
│   │   │   ├── LoginHandler.php
│   │   │   ├── RegisterHandler.php
│   │   │   └── SessionManager.php
│   │   │
│   │   ├── goals/
│   │   │   ├── GoalController.php
│   │   │   ├── GoalRepository.php
│   │   │   └── GoalLogController.php
│   │   │
│   │   ├── dreams/
│   │   │   ├── DreamController.php
│   │   │   └── DreamRepository.php
│   │   │
│   │   └── categories/
│   │       ├── CategoryController.php
│   │       └── CategoryRepository.php
│   │
│   ├── lib/
│   │   ├── helpers.php
│   │   ├── Database.php
│   │   └── Auth.php
│   │
│   ├── views/
│   │   ├── auth/
│   │   │   ├── login.php
│   │   │   ├── register.php
│   │   │   └── forgot.php
│   │   │
│   │   ├── dashboard/
│   │   │   ├── index.php
│   │   │   ├── dreams.php
│   │   │   ├── goals.php
│   │   │   ├── categories.php
│   │   │   └── logs.php
│   │   │
│   │   └── partials/
│   │       ├── dashboard-start.php
│   │       └── dashboard-end.php
│   │
│   └── assets/                  # Source frontend assets
│       ├── js/
│       │   ├── auth.js
│       │   └── app.js
│       └── css/
│           ├── auth.css
│           ├── dashboard.css
│           └── style.css
│
├── config/
│   ├── app.php
│   └── database.php
│
├── DB/                          # SQL schema
├── var/                         # Runtime/session storage
├── legacy/                      # Archived old code
└── public/assets/               # Served copies of CSS/JS
````

---

## Architecture Overview

This application follows a practical separation of concerns:

### 1. `public/` = HTTP entry points

These files receive incoming browser requests.

Examples:

* `public/login.php`
* `public/dashboard.php`
* `public/api/goals.php`

These files should stay thin and mainly handle:

* bootstrapping
* auth checks
* request dispatch
* rendering or returning a response

---

### 2. `src/views/` = PHP templates

These files render HTML for pages.

Examples:

* `src/views/auth/login.php`
* `src/views/dashboard/goals.php`

Views are responsible for presentation, not database access or heavy business logic.

---

### 3. `src/api/...Controller.php` and handlers = request/business flow

These files coordinate what should happen when a request comes in.

Examples:

* `LoginHandler.php`
* `RegisterHandler.php`
* `GoalController.php`
* `DreamController.php`

They typically:

* validate input
* call auth or repository logic
* decide what response to return

---

### 4. `src/api/...Repository.php` = data access

Repositories handle database queries for a specific feature.

Examples:

* `GoalRepository.php`
* `DreamRepository.php`
* `CategoryRepository.php`

This keeps SQL out of views and helps avoid logic duplication.

---

### 5. `src/lib/` = shared infrastructure

Important shared files include:

* `bootstrap.php`
  Sets up autoloading, helpers, timezone, and session storage path.

* `helpers.php`
  Contains helper functions such as:

  * `config()`
  * `view()`
  * `redirect()`
  * `safe_output()`
  * `wants_json()`

* `Database.php`
  Manages the singleton PDO connection.

* `Auth.php`
  Handles login, logout, session checks, current user lookup, and `requireAuth()`.

---

### 6. `src/assets/` and `public/assets/`

* `src/assets/` is the source of truth for frontend code
* `public/assets/` contains the served copies used by the browser

---

## Request Flow

### Page request example

When a user visits:

```text
/public/dashboard.php
```

Typical flow:

1. The request enters through `public/dashboard.php`
2. `src/bootstrap.php` is loaded
3. Auth is checked through `Auth.php`
4. Data is prepared
5. A view such as `src/views/dashboard/index.php` is rendered
6. The browser receives HTML
7. CSS and JS are loaded from `public/assets/`

---

### API request example

When frontend JavaScript sends a request to:

```text
/public/api/goals.php
```

Typical flow:

1. The request enters through `public/api/goals.php`
2. The app is bootstrapped
3. Auth/session is checked if needed
4. `GoalController.php` handles request logic
5. `GoalRepository.php` performs DB operations
6. JSON response is returned
7. `app.js` updates the UI in the browser

---

## Authentication Flow

Relevant files:

* `public/login.php`
* `public/register.php`
* `public/forgot.php`
* `public/logout.php`
* `public/api/auth/login.php`
* `public/api/auth/register.php`
* `public/api/auth/forgot.php`
* `src/lib/Auth.php`
* `src/api/auth/AuthInputValidator.php`
* `src/api/auth/LoginHandler.php`
* `src/api/auth/RegisterHandler.php`
* `src/api/auth/SessionManager.php`
* `src/assets/js/auth.js`

### Login flow

1. User opens `public/login.php`
2. The login view is rendered
3. `auth.js` validates fields in the browser
4. The request is submitted to `public/api/auth/login.php`
5. `LoginHandler.php` processes the request
6. `AuthInputValidator.php` validates the input
7. `Auth.php` verifies credentials and starts the session
8. A JSON response is returned
9. The frontend handles success or error feedback

---

## Frontend Behavior

### `auth.js`

Handles:

* client-side auth form validation
* early feedback to users
* field-level error display

### `app.js`

Handles:

* dashboard-side interactions
* `fetch()` requests to API endpoints
* dynamic UI updates after API responses

The app is intentionally designed as:

* **server-rendered first**
* **enhanced with JavaScript where useful**

---

## Database Access

Database configuration lives in:

* `config/database.php`

Connection handling lives in:

* `src/lib/Database.php`

Database operations are organized through repositories, such as:

* `GoalRepository.php`
* `DreamRepository.php`
* `CategoryRepository.php`

The application uses **PDO** for database access.

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Configure the database

Update:

```text
config/database.php
```

with your MySQL credentials.

Example values typically include:

* host
* port
* database name
* username
* password

### 3. Import the database schema

Use the SQL files inside:

```text
DB/
```

Import them into your MySQL database.

### 4. Configure your local server

Point your web server document root to:

```text
public/
```

This is important because `public/` is the web root.

### 5. Make sure runtime/session storage is writable

The app uses:

```text
var/
```

for runtime/session-related storage, so ensure PHP can write there if required.

### 6. Sync frontend assets if needed

Since `src/assets/` is the source and `public/assets/` contains served copies, make sure the public assets are updated after frontend changes.

---

## Development Notes

### What is good in this architecture

* Clear separation between web root and source code
* Shared bootstrap process
* Dedicated auth class
* Repository-based DB access in key areas
* Server-rendered pages remain simple to follow
* JavaScript is used as enhancement, not as the whole app

### Known technical debt / future improvements

* Some `public/*.php` files may still contain page-specific SQL
* Repository usage should become more consistent across all pages
* Some logic may still be duplicated between page files and API flows
* Asset syncing between `src/assets` and `public/assets` should be improved
* `app.js` may eventually be split by feature for maintainability

---

## Suggested Refactor Direction

Future cleanup should prioritize:

1. Thinner `public/*.php` files
2. More consistent repository usage
3. Less duplicated logic
4. Cleaner asset pipeline
5. Smaller frontend JS files split by feature

The goal is to improve maintainability **without** overengineering or turning the project into a framework-heavy rewrite.

---

## How to Debug as a Junior Developer

When something breaks, trace the request in this order:

### For page issues

1. Which `public/*.php` file receives the request?
2. Which view is rendered?
3. Is auth blocking access?
4. Where is the page data coming from?
5. Are the correct JS/CSS assets loaded?

### For API issues

1. Which `public/api/*.php` file receives the request?
2. Which controller/handler processes it?
3. Which repository talks to the database?
4. What JSON is returned?
5. How does `app.js` or `auth.js` handle that response?

---

## Mental Model

A simple way to think about the app:

* `public/` receives requests
* `bootstrap.php` prepares the app
* `Auth.php` protects private pages and APIs
* controllers/handlers decide what should happen
* repositories talk to MySQL
* views render HTML
* JavaScript enhances the UI and calls APIs when needed

In one sentence:

> This is a server-rendered PHP application with structured backend modules and lightweight JavaScript enhancements for interactivity.

---

## License

MIT license



---

## Author

* Rostel GENI.



