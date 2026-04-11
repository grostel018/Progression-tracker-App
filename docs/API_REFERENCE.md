# API Reference

This document covers the authenticated and public endpoints exposed from `public/` and `public/api/`.

## Conventions

### Authentication model

- The app uses session-based authentication
- Protected page routes redirect unauthenticated users to `login.php`
- Protected API routes return `401` JSON

### Request formats

API endpoints accept:

- JSON request bodies
- standard form posts
- URL query parameters for IDs and mode switches

### CSRF protection

All state-changing API requests require a valid CSRF token.

Send it as either:

- body field: `_csrf`
- header: `X-CSRF-Token`

GET requests do not require CSRF.

### Response style

Most mutating endpoints respond with a shape similar to:

```json
{
  "success": true,
  "message": "Goal created",
  "id": 123
}
```

Validation and auth failures commonly return:

```json
{
  "success": false,
  "message": "Category name is required"
}
```

or:

```json
{
  "error": "Unauthorized"
}
```

## Page Routes

### Public pages

- `GET /index.php`
- `GET /login.php`
- `GET /register.php`
- `GET /forgot.php`
- `GET /reset-password.php?token=<raw-token>`

### Authenticated pages

- `GET /dashboard.php`
- `GET /categories.php`
- `GET /dreams.php`
- `GET /goals.php`
- `GET /logs.php`

### Logout

- `POST /logout.php`

## Auth API

### `POST /api/auth/register.php`

Creates a user account.

Required fields:

- `username`
- `email`
- `password`
- `password2`

Rules:

- username length: 3 to 32 characters
- username characters: letters, numbers, `_`, `-`
- password minimum length: 10
- password must include at least one letter and one number

Success response:

```json
{
  "success": true,
  "message": "Registration successful"
}
```

### `POST /api/auth/login.php`

Authenticates a user and starts a session.

Required fields:

- `email`
- `password`

Rate limiting:

- 10 attempts per 15 minutes by IP
- 10 attempts per 15 minutes by normalized email hash

### `POST /api/auth/forgot.php`

Starts the password reset flow.

Required fields:

- `email`

Behavior:

- always returns a generic success message
- invalid or unregistered emails do not reveal account existence
- creates a one-time token valid for 30 minutes when the email exists

### `POST /api/auth/reset-password.php`

Consumes a raw reset token and updates the password.

Required fields:

- `token`
- `password`
- `password_confirm`

Rules:

- token must be a 64-character hex string
- password minimum length: 10
- password must include at least one letter and one number

## Session and User Status

### `GET /api/session.php`

Returns the current session state.

Unauthenticated:

```json
{
  "authenticated": false
}
```

Authenticated:

```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "created_at": "2026-03-29 10:00:00"
  }
}
```

## Categories API

Endpoint: `/api/categories.php`

### `GET`

- without query params: list all categories for the current user
- with `?id=<category-id>`: fetch a single category

### `POST`

Creates a category.

Required fields:

- `name`

### `PUT`

Updates a category.

Required query param:

- `id`

Supported body fields:

- `name`

### `DELETE`

Deletes a category.

Required query param:

- `id`

## Dreams API

Endpoint: `/api/dreams.php`

### `GET`

- list all dreams
- or `?id=<dream-id>` to fetch one dream

### `POST`

Creates a dream.

Required fields:

- `title`
- `category_id`

Optional fields:

- `description`
- `start_date`
- `estimated_finish_date`
- `current_progress_percent`
- `status`

Ownership rule:

- `category_id` must belong to the current user

### `PUT`

Required query param:

- `id`

Supported fields:

- `category_id`
- `title`
- `description`
- `start_date`
- `estimated_finish_date`
- `current_progress_percent`
- `status`

### `DELETE`

Required query param:

- `id`

## Goals API

Endpoint: `/api/goals.php`

### `GET`

- list all goals
- or `?id=<goal-id>` to fetch one goal

### `POST`

Creates a goal.

Required fields:

- `dream_id`
- `title`
- `goal_type`
- `start_date`

Optional fields:

- `description`
- `estimated_finish_date`
- `current_progress_percent`

Ownership rule:

- `dream_id` must belong to the current user

### `PUT`

Required query param:

- `id`

Supported fields:

- `dream_id`
- `title`
- `description`
- `goal_type`
- `start_date`
- `estimated_finish_date`
- `current_progress_percent`
- `status`

### `DELETE`

Required query param:

- `id`

## Goal Tasks API

Endpoint: `/api/goal-tasks.php`

### `GET`

Required query param:

- `goal_id`

Lists tasks for a goal.

### `POST`

Required query param:

- `goal_id`

Required body fields:

- `title`

Optional body fields:

- `description`
- `sort_order`

### `PUT`

Required query param:

- `id`

Supported body fields:

- `title`
- `description`
- `sort_order`
- `is_completed`
- `completed_on`

`is_completed` toggles task completion and creates a `task_completion` history entry when set to true.

### `DELETE`

Required query param:

- `id`

## Goal Habits API

Endpoint: `/api/goal-habits.php`

### `GET`

Required query param:

- `goal_id`

Lists habits for a goal, including today's action count and total action count.

### `POST`

Required query param:

- `goal_id`

Required body fields:

- `title`

Optional body fields:

- `description`
- `sort_order`

### `PUT`

Required query param:

- `id`

Supported body fields:

- `title`
- `description`
- `sort_order`

### `DELETE`

Required query param:

- `id`

## Goal Habit Logs API

Endpoint: `/api/goal-habit-logs.php`

### `POST`

Required query param:

- `habit_id`

Optional body fields:

- `logged_on`
- `note`

This records a habit action, creates a `goal_habit_logs` row, and adds a matching `habit_action` history entry.

## Goal Logs API

Endpoint: `/api/goal-logs.php`

This endpoint manages manual history entries specifically for a goal.

### `GET`

Required query param:

- `goal_id`

Returns up to 50 recent goal history entries.

### `POST`

Required query param:

- `goal_id`

Supported body fields:

- `log_date`
- `note`
- `progress_percent`

The controller maps this request into the shared history service with `entity_type=goal`.

### `PUT`

Required query params:

- `goal_id`
- `id`

Current behavior:

- direct goal log updates are not supported
- the endpoint returns a failure message instructing the client to create a new history entry instead

### `DELETE`

Required query params:

- `goal_id`
- `id`

Current behavior:

- direct goal log deletes are not supported

## History API

Endpoint: `/api/history.php`

### `GET /api/history.php`

Returns an overview response.

Supported query params:

- `scope`: `dashboard`, `goal`, or `dream`
- `range`: `week`, `month`, `year`, or `30d` depending on scope
- `id`: required for `goal` and `dream` scope

Dashboard overview includes:

- heatmap cells
- progress series
- breakdowns for goals and dreams
- recent entries
- available entities

### `GET /api/history.php?mode=day`

Returns entries and form defaults for a single day.

Supported query params:

- `date`
- `scope`
- `id`

### `GET /api/history.php?mode=weekly-review`

Returns weekly review analytics, including:

- active days
- total entries
- task completions
- habit actions
- manual logs
- top active entities
- stale tracked entities

### `POST /api/history.php`

Creates a manual history entry.

Required body fields:

- `entity_type`: `goal` or `dream`
- `entity_id`

At least one of:

- `note`
- `progress_percent`

Optional body field:

- `entry_date`

When `progress_percent` is provided, the app also writes a `progress_snapshots` row and updates the tracked entity's current progress.

## Logs and Achievements

### `GET /api/logs.php`

Returns audit and activity logs for the authenticated user.

### `GET /api/achievements.php`

Returns achievements earned by the authenticated user.

## Error Notes

Common API failure cases:

- `401`: not logged in
- `405`: unsupported HTTP method
- `419`: CSRF token mismatch
- `429`: auth-related rate limit reached

The exact error body varies slightly by endpoint, so client-side code should read both `message` and `error` when present.

