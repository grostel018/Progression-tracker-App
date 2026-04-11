# Technical Architecture

This document presents the recommended technical architecture for the planned next-generation version of Progression Tracker from the perspective of a senior software engineer designing for a polished MVP, low operational cost, strong maintainability, and future growth.

## 1. Recommended Stack

### Frontend and web application

- Next.js
- TypeScript
- React
- Tailwind CSS or a token-driven CSS system

### Backend and application logic

- Next.js server-side application layer using route handlers and server-side actions where appropriate
- Feature-based service layer in the same codebase

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- Auth.js or an equivalent modern authentication library
- Email/password authentication
- Google OAuth

### Local-first mode

- IndexedDB for local-only persistence in the browser
- A storage abstraction layer to support both local and cloud-backed modes

### File and media storage

- Local development storage initially
- S3-compatible object storage later for avatars and images when needed

### Notifications

- Email notifications for reminders
- Browser notifications when user permission is granted
- In-app reminder system stored in application data

### Deployment

- Vercel or a similar low-friction platform for the web app
- Managed PostgreSQL such as Neon, Supabase Postgres, or another low-cost PostgreSQL provider

## 2. Reason for Each Choice

### Why Next.js

Next.js is recommended because it gives a solo engineer a strong balance of productivity and structure.

Benefits:
- supports modern React-based UI development
- supports both public marketing pages and authenticated application pages in one project
- supports server-side rendering where useful
- supports API routes and server logic in the same repository
- reduces deployment and architectural overhead

This is a good fit because the product needs both:
- a polished marketing-facing experience
- a complex authenticated application experience

### Why TypeScript

TypeScript is recommended because the product has enough domain complexity to justify type safety early.

Benefits:
- reduces errors in data models and feature interactions
- makes refactoring safer
- improves maintainability as the codebase grows
- helps enforce consistency across frontend and backend logic

### Why PostgreSQL

PostgreSQL is recommended over SQLite and preferred over MySQL for this new version.

Benefits:
- better long-term fit for evolving relational models
- strong support for structured queries and indexing
- good ecosystem support with Prisma
- suitable for future analytics, audit data, and social features

The planned product has multiple related entities, optional relationships, histories, and future community features. PostgreSQL handles that evolution better than a lightweight local database approach.

### Why Prisma

Prisma is recommended for speed, safety, and maintainability.

Benefits:
- strong schema-driven workflow
- easier database evolution for a solo developer
- type-safe queries in TypeScript
- easier onboarding and debugging compared with lower-level SQL-heavy approaches

### Why Auth.js or equivalent

A proven auth library is recommended instead of building authentication from scratch.

Benefits:
- reduces security mistakes
- speeds up implementation of email/password and Google sign-in
- provides a better baseline for sessions, OAuth, and account linking
- allows focus on product differentiation instead of reinventing auth

### Why IndexedDB for local mode

The product requirement for local-only usage is important and should not be treated as a hack.

IndexedDB is recommended because:
- it supports meaningful local persistence in the browser
- it is more suitable than localStorage for larger and more structured data
- it supports a better foundation for migration into cloud accounts later

### Why a modular monolith

A modular monolith is the right choice for the MVP.

Benefits:
- faster development
- lower cost
- simpler testing and debugging
- enough separation to keep the codebase organized
- avoids early distributed-system complexity

The product does not need microservices at this stage.

## 3. App Structure

The application should use a feature-based modular monolith structure.

### Recommended top-level structure

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
    admin/
    api/
  components/
    ui/
    shared/
  features/
    auth/
    onboarding/
    dreams/
    goals/
    habits/
    tasks/
    categories/
    streaks/
    activity/
    weekly-review/
    notifications/
    profiles/
    admin/
  lib/
    db/
    auth/
    email/
    storage/
    analytics/
    validation/
    permissions/
    utils/
  styles/
  constants/
  types/
prisma/
public/
docs/
```

### Why this structure

This structure keeps the app organized around product features rather than technical file types alone.

That improves:
- discoverability
- ownership of business logic
- easier refactoring later
- reduced coupling between unrelated parts of the app

### Recommended internal feature structure

```text
features/goals/
  components/
  actions/
  queries/
  service.ts
  repository.ts
  validators.ts
  types.ts
  mapper.ts
```

### Layering approach

Within the monolith, follow these layers:

- Presentation layer: UI, forms, route handlers, screens
- Application layer: orchestration and use cases
- Domain layer: business rules, progress logic, streak logic, permissions
- Infrastructure layer: database, email, storage, auth integration, analytics

## 4. Database Design Overview

The planned database should model the product around users, goals, dreams, habits, tasks, tracking events, and weekly review.

### Core entities

- User
- Profile
- OnboardingPreference
- Category
- Dream
- Goal
- Habit
- HabitCompletion
- Task
- TaskCompletion
- ActivityEvent
- Streak
- WeeklyReview
- Reflection
- ReminderPreference
- Notification
- FeatureFlag
- BugReport

### Key relationship principles

- one user owns many categories
- one user owns many dreams
- one user owns many goals
- a goal may optionally belong to a dream
- a dream may have zero or many goals
- one user owns many habits
- one user owns many tasks
- habits and tasks may optionally be linked to a goal
- task completions and habit completions should be stored separately from the task or habit definition itself
- activity events should capture a normalized timeline of key user actions
- weekly reviews and reflections should be user-owned and time-scoped

### Important design rules

- do not force every goal to belong to a dream
- do not force every dream to immediately contain goals
- keep local mode and cloud mode data models structurally similar
- store histories as separate records, not only as derived current state
- prefer explicit relationships over hidden JSON blobs for important product data

### Suggested initial tables or models

- users
- profiles
- onboarding_preferences
- categories
- dreams
- goals
- habits
- habit_completions
- tasks
- task_completions
- activity_events
- streaks
- weekly_reviews
- reflections
- reminder_preferences
- notifications
- bug_reports
- feature_flags

### Data strategy for local mode

Local mode should mirror the same conceptual model used in the cloud database.

That makes:
- migration easier
- UI reuse easier
- logic consistency easier
- long-term maintenance easier

## 5. Authentication Design

The application should support both anonymous local usage and authenticated cloud usage.

### Authentication modes

- Local-only mode with no account
- Registered account mode

### Registered account methods

- email and password
- Google OAuth

### Required account flows

- sign up
- sign in
- sign out
- password reset
- email verification
- session persistence
- local-to-cloud migration

### Session strategy

Use secure server-managed sessions or equivalent proven session handling from the auth library.

Recommended behavior:
- authenticated routes require a valid session
- public routes remain accessible without auth
- admin routes require additional role checks

### Local-to-cloud migration design

When a local user creates or logs into an account:
- the app should detect local data
- the app should offer migration into the account
- migration should be explicit and user-confirmed
- imported entities should preserve relationships and history where possible

## 6. Security Considerations

Security should be treated as a product requirement, not a later improvement.

### Authentication security

- use a trusted authentication library
- hash passwords using modern secure hashing
- require email verification for cloud accounts
- protect account recovery flows carefully
- rate limit sign-in, registration, and reset endpoints

### Application security

- validate all write inputs server-side
- sanitize uploaded files and validate file types
- protect admin routes with explicit permission checks
- avoid trusting client-provided ownership or role data
- log important admin actions and security-relevant events

### Privacy and data safety

- collect only data that is useful to the product
- keep optional identity fields optional
- treat youth users carefully and conservatively
- prepare public-facing features with future moderation awareness

### Web security

- use CSRF protection where appropriate
- use secure cookies and proper session settings
- use HTTPS in all production environments
- avoid exposing secrets in the client
- use strong environment separation between dev and production

## 7. Maintainability Considerations

The codebase should be optimized for clarity and iteration speed.

### Recommended maintainability practices

- feature-based organization
- TypeScript throughout the app
- shared validation schemas
- clear service and repository boundaries
- avoid putting business logic directly in UI components
- keep domain rules centralized
- document major architectural decisions
- use consistent naming conventions

### Testing strategy

Recommended testing balance for MVP:
- unit tests for important domain logic
- integration tests for auth, persistence, and key feature flows
- a smaller number of end-to-end tests for critical user journeys

### Design system maintainability

- build reusable UI primitives early
- use design tokens consistently
- avoid one-off styling patterns for important components
- keep theme logic centralized

### Operational maintainability

- simple deployment path
- simple logging and monitoring setup
- minimal infrastructure surface area at first
- backups and recovery planning from the start

## 8. What to Avoid Overengineering

The product has enough ambition already. The architecture should stay disciplined and practical.

### Avoid these too early

- microservices
- Kubernetes or complex container orchestration
- event-driven architectures for everything
- Redis before there is a clear need
- background worker systems before reminders or notifications become heavy
- advanced CQRS separation
- domain-driven design ceremony that slows delivery
- too many abstractions around simple CRUD features
- building a full plugin system
- building a custom auth system from scratch
- premature optimization for millions of users

### Recommended pragmatic approach

Build:
- a strong modular monolith
- a clean data model
- a shared local/cloud persistence abstraction
- strong UI foundations
- secure and maintainable auth

Delay until justified:
- distributed systems
- advanced scaling infrastructure
- complex social architecture
- monetization infrastructure
- deep moderation systems

## 9. Final Recommendation

The strongest engineering recommendation is to build Progression Tracker as a TypeScript-based modular monolith using Next.js, PostgreSQL, Prisma, a trusted auth solution, and a local/cloud storage abstraction from the start.

This approach gives the project:
- fast solo development
- low cost
- strong maintainability
- enough scalability for the next phase of growth
- a realistic path from MVP to a larger product without rewriting everything
