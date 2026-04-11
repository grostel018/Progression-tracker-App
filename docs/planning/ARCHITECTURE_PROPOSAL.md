# Architecture Proposal

## 1. Architecture Recommendation

The recommended architecture for the planned product is a modular monolith.

This is the best fit for the project because it provides:

- lower hosting and operational cost
- faster implementation for a solo engineer
- simpler debugging and deployment
- enough structure to grow later
- a clean path toward 10k users without premature complexity

Microservices are not recommended for the MVP.

## 2. Proposed Stack Direction

Recommended stack for the new version:

- Frontend: Next.js with TypeScript
- Backend: Next.js route handlers and server-side application logic
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Auth.js or equivalent modern auth solution
- Storage: local persistence for device mode, object storage later for avatars/images
- Notifications: email and browser notifications, with background jobs later if needed

This stack is recommended because:

- JavaScript and TypeScript align with the owner's familiarity
- a single full-stack web codebase reduces complexity
- mobile-first responsive UX is straightforward
- PostgreSQL provides a better long-term data foundation for evolving product needs

## 3. Architectural Style

Use a layered, feature-based modular monolith.

### Layers

- Presentation layer
- Application layer
- Domain layer
- Infrastructure layer

### Presentation layer responsibilities

- pages and route handlers
- layouts
- feature screens
- forms
- reusable UI components

### Application layer responsibilities

- use cases
- orchestration logic
- validation workflows
- feature-specific commands and queries

### Domain layer responsibilities

- business rules
- core entities
- enums
- permission rules
- progress and streak logic

### Infrastructure layer responsibilities

- database access
- auth integration
- email delivery
- file storage
- analytics
- notifications

## 4. Product Modules

Recommended module boundaries:

- auth
- users
- onboarding
- dreams
- goals
- habits
- tasks
- categories
- streaks
- activity
- weekly-review
- notifications
- profiles
- admin
- shared

## 5. Folder Structure Proposal

### Recommended single-app starting structure

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
  types/
  constants/
prisma/
docs/
public/
```

### Feature module internal structure

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

This pattern should be reused for most features.

## 6. Local vs Cloud Architecture

This product requires local mode and account mode to coexist.

Recommended strategy:

- use the same UI and domain models for both modes
- abstract persistence behind a storage layer
- implement separate storage adapters for local and cloud behavior

### Suggested storage abstraction

```text
lib/storage/
  adapter.ts
  local/
    indexeddb.ts
  cloud/
    api-client.ts
```

### Benefits

- avoids duplicating UI logic
- supports migration from local mode to cloud mode
- keeps business logic consistent
- supports future expansion more safely

## 7. Core Data Entities

The following entities should exist in the planned data model:

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
- WeeklyReview
- ReminderPreference
- Notification
- FeatureFlag
- BugReport

Key data rules:

- goals may exist without dreams
- dreams may exist without goals
- habits and tasks may be linked to goals
- local and cloud data models should stay structurally similar

## 8. API Boundary Proposal

Even if the project uses a full-stack framework, maintain a clean API boundary.

Suggested route groups:

- `/api/auth/*`
- `/api/onboarding/*`
- `/api/dreams/*`
- `/api/goals/*`
- `/api/habits/*`
- `/api/tasks/*`
- `/api/categories/*`
- `/api/streaks/*`
- `/api/activity/*`
- `/api/weekly-review/*`
- `/api/profile/*`
- `/api/notifications/*`
- `/api/admin/*`

## 9. Security Architecture

Security requirements for the planned build:

- secure session or token strategy
- strong password hashing
- input validation on all write operations
- rate limiting on auth flows
- admin role protection
- secure file upload validation
- audit logging for important admin actions
- email verification for registered accounts

Because younger users may use the app, privacy defaults should be conservative.

## 10. Design System Direction

The planned implementation should include a real reusable design system.

### Suggested design system areas

```text
components/ui/
  button/
  input/
  modal/
  card/
  badge/
  tabs/
  avatar/
  progress-ring/
  streak-indicator/
```

### Theme support

- light mode
- dark mode
- future user vibe/theme variation support

## 11. Scalability Strategy

### Stage 1

- single deployable app
- PostgreSQL database
- no Redis required initially
- simple reminders and background tasks

### Stage 2

- add Redis for caching, rate limiting, or job support if needed
- move reminders and notifications into background processing
- add CDN/object storage for media

### Stage 3

- only split services if the product genuinely needs it
- extract analytics or notification workers later if usage requires it
- evolve toward social/community modules gradually

## 12. Why This Architecture Fits the Project

This proposal balances:

- speed of solo development
- maintainability
- low cost
- strong UX ambition
- future scalability

It gives the project enough professionalism and structure without overcomplicating the MVP.
