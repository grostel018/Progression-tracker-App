# Current Implementation Note

This document is a target-state MVP schema proposal.

The code currently implemented in `next-app/` does **not** include this full schema yet. The real Prisma schema currently covers only the auth and identity subset:
- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Profile`
- `OnboardingPreference`

For the current code-aligned schema status, see `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`.

---
# MVP Database Schema

This document defines the full MVP database schema proposal for the next-generation version of Progression Tracker.

It is based on the agreed product requirements, MVP scope, architecture, backlog, and milestone plan.

## 1. Core Entities and Relationships

### Identity and account

- `User`
  The root account for cloud users.

- `AuthAccount`
  External provider links such as Google OAuth.

- `Session`
  Active authenticated sessions.

- `Profile`
  User presentation and privacy-controlled profile data.

- `OnboardingPreference`
  Stores onboarding answers and personalization data.

### Planning and tracking

- `Category`
  Life area or organizational grouping.

- `Dream`
  Long-term aspiration. Can exist without goals.

- `Goal`
  Concrete objective. Can exist without dreams.

- `Habit`
  Recurring behavior. Can optionally link to a goal.

- `HabitCompletion`
  Individual habit completion records.

- `Task`
  Actionable item. Can optionally link to a goal.

- `TaskCompletion`
  Individual task completion records.

- `ActivityEvent`
  Normalized activity timeline for dashboard and weekly review.

- `Streak`
  Cached or derived consistency metrics.

- `WeeklyReview`
  Weekly summary and review snapshot.

- `Reflection`
  Optional journal-style note, optionally linked to a weekly review.

### Preferences and communication

- `ReminderPreference`
  Per-channel reminder preferences.

- `Reminder`
  Scheduled reminder definitions.

- `Notification`
  In-app notifications.

### Admin and operational support

- `BugReport`
  Tester or user-submitted issue reports.

- `FeatureFlag`
  Controlled rollout or test gating.

- `AuditLog`
  Sensitive/admin-level logging.

## 2. ERD-Style Explanation in Plain English

- One `User` has one `Profile` and one `OnboardingPreference`.
- One `User` can have many `AuthAccount` records and many `Session` records.
- One `User` can own many `Category`, `Dream`, `Goal`, `Habit`, `Task`, `WeeklyReview`, `Reflection`, `Notification`, `Reminder`, and `BugReport` records.
- A `Dream` belongs to one user and may optionally belong to one `Category`.
- A `Goal` belongs to one user and may optionally belong to one `Dream` and one `Category`.
- A `Habit` belongs to one user and may optionally belong to one `Goal` and one `Category`.
- A `Task` belongs to one user and may optionally belong to one `Goal` and one `Category`.
- A `HabitCompletion` belongs to one `Habit` and one `User`.
- A `TaskCompletion` belongs to one `Task` and one `User`.
- `ActivityEvent` belongs to one `User` and may reference any tracked entity by `entityType` and `entityId`.
- `Streak` belongs to one `User` and may optionally reference a related entity when the streak is goal-, task-, or habit-specific.
- `WeeklyReview` belongs to one `User`.
- A `Reflection` belongs to one `User` and may optionally belong to one `WeeklyReview`.
- `ReminderPreference`, `Reminder`, and `Notification` all belong to one `User`.
- `AuditLog` optionally belongs to an acting `User`.

### Important product rules reflected in the schema

- Dreams do not require goals.
- Goals do not require dreams.
- Tasks and habits may optionally link to goals.
- Privacy-sensitive user fields remain optional.
- Local mode can use the same entity structure and IDs for later migration to cloud mode.

## 3. Prisma Schema Proposal

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  TESTER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum ProfileVisibility {
  PRIVATE
  PUBLIC
}

enum DreamStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum GoalStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
  FAILED
}

enum GoalMeasurementType {
  NONE
  BINARY
  PERCENTAGE
  COUNT
  DURATION
  WEIGHT
}

enum HabitStatus {
  ACTIVE
  PAUSED
  ARCHIVED
}

enum HabitFrequencyType {
  DAILY
  WEEKDAYS
  WEEKLY
  CUSTOM
}

enum TaskStatus {
  OPEN
  COMPLETED
  ARCHIVED
}

enum TaskRepeatType {
  NONE
  DAILY
  WEEKLY
  CUSTOM
}

enum StreakType {
  GLOBAL_ACTIVITY
  HABIT
  GOAL
  TASK
}

enum EntityType {
  DREAM
  GOAL
  HABIT
  TASK
  WEEKLY_REVIEW
}

enum ReminderChannelType {
  IN_APP
  EMAIL
  BROWSER
}

enum ReminderStatus {
  ACTIVE
  PAUSED
  DISABLED
}

enum NotificationType {
  SYSTEM
  REMINDER
  STREAK
  WEEKLY_REVIEW
  GOAL_PROGRESS
}

enum BugReportStatus {
  OPEN
  IN_REVIEW
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum BugReportSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id                   String                @id @default(cuid())
  email                String                @unique
  username             String                @unique
  passwordHash         String?
  emailVerifiedAt      DateTime?
  role                 UserRole              @default(USER)
  status               UserStatus            @default(ACTIVE)
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  profile              Profile?
  onboardingPreference OnboardingPreference?
  authAccounts         AuthAccount[]
  sessions             Session[]

  categories           Category[]
  dreams               Dream[]
  goals                Goal[]
  habits               Habit[]
  habitCompletions     HabitCompletion[]
  tasks                Task[]
  taskCompletions      TaskCompletion[]
  activityEvents       ActivityEvent[]
  streaks              Streak[]
  weeklyReviews        WeeklyReview[]
  reflections          Reflection[]
  reminderPreferences  ReminderPreference[]
  reminders            Reminder[]
  notifications        Notification[]
  bugReports           BugReport[]           @relation("BugReportReporter")
  auditLogs            AuditLog[]            @relation("AuditLogActor")

  @@index([role])
  @@index([status])
}

model AuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  createdAt         DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Profile {
  id                 String            @id @default(cuid())
  userId             String            @unique
  displayName        String?
  avatarUrl          String?
  bio                String?
  gender             String?
  uiThemePreference  String?
  visibility         ProfileVisibility @default(PRIVATE)
  allowDiscoverability Boolean         @default(false)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model OnboardingPreference {
  id                         String   @id @default(cuid())
  userId                     String   @unique
  focusArea                  String?
  motivationStyle            String?
  struggleAreas              Json?
  reminderPreferenceSummary  String?
  onboardingCompletedAt      DateTime?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Category {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String?
  icon      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  dreams Dream[]
  goals  Goal[]
  habits Habit[]
  tasks  Task[]

  @@unique([userId, name])
  @@index([userId])
}

model Dream {
  id          String      @id @default(cuid())
  userId      String
  categoryId  String?
  title       String
  description String?
  status      DreamStatus @default(ACTIVE)
  targetDate  DateTime?
  archivedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  goals    Goal[]

  @@index([userId])
  @@index([categoryId])
  @@index([userId, status])
}

model Goal {
  id              String              @id @default(cuid())
  userId          String
  categoryId      String?
  dreamId         String?
  title           String
  description     String?
  goalType        String?
  measurementType GoalMeasurementType @default(NONE)
  targetValue     Decimal?            @db.Decimal(12, 2)
  currentValue    Decimal?            @db.Decimal(12, 2)
  targetDate      DateTime?
  status          GoalStatus          @default(ACTIVE)
  archivedAt      DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  dream    Dream?    @relation(fields: [dreamId], references: [id], onDelete: SetNull)
  habits   Habit[]
  tasks    Task[]

  @@index([userId])
  @@index([categoryId])
  @@index([dreamId])
  @@index([userId, status])
}

model Habit {
  id              String             @id @default(cuid())
  userId          String
  goalId          String?
  categoryId      String?
  title           String
  description     String?
  frequencyType   HabitFrequencyType
  frequencyConfig Json?
  status          HabitStatus        @default(ACTIVE)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal          Goal?              @relation(fields: [goalId], references: [id], onDelete: SetNull)
  category      Category?          @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  completions   HabitCompletion[]

  @@index([userId])
  @@index([goalId])
  @@index([categoryId])
  @@index([userId, status])
}

model HabitCompletion {
  id          String   @id @default(cuid())
  userId      String
  habitId      String
  completedOn DateTime
  quantity    Decimal? @db.Decimal(12, 2)
  note        String?
  createdAt   DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([habitId])
  @@index([habitId, completedOn])
  @@index([userId, completedOn])
}

model Task {
  id          String         @id @default(cuid())
  userId      String
  goalId      String?
  categoryId  String?
  title       String
  description String?
  dueDate     DateTime?
  repeatType  TaskRepeatType @default(NONE)
  status      TaskStatus     @default(OPEN)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal        Goal?            @relation(fields: [goalId], references: [id], onDelete: SetNull)
  category    Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  completions TaskCompletion[]

  @@index([userId])
  @@index([goalId])
  @@index([categoryId])
  @@index([userId, status])
  @@index([dueDate])
}

model TaskCompletion {
  id          String   @id @default(cuid())
  userId      String
  taskId      String
  completedAt DateTime
  note        String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([taskId])
  @@index([taskId, completedAt])
  @@index([userId, completedAt])
}

model ActivityEvent {
  id         String     @id @default(cuid())
  userId     String
  eventType  String
  entityType EntityType?
  entityId   String?
  metadata   Json?
  occurredAt DateTime
  createdAt  DateTime   @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, occurredAt])
  @@index([entityType, entityId])
}

model Streak {
  id                String     @id @default(cuid())
  userId            String
  streakType        StreakType
  relatedEntityType EntityType?
  relatedEntityId   String?
  currentCount      Int        @default(0)
  longestCount      Int        @default(0)
  lastCountedOn     DateTime?
  updatedAt         DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, streakType])
  @@index([relatedEntityType, relatedEntityId])
}

model WeeklyReview {
  id              String   @id @default(cuid())
  userId          String
  reviewWeekStart DateTime
  reviewWeekEnd   DateTime
  summarySnapshot Json?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  reflections Reflection[]

  @@index([userId])
  @@index([userId, reviewWeekStart])
  @@unique([userId, reviewWeekStart])
}

model Reflection {
  id             String   @id @default(cuid())
  userId         String
  weeklyReviewId String?
  title          String?
  body           String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  weeklyReview WeeklyReview? @relation(fields: [weeklyReviewId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([weeklyReviewId])
}

model ReminderPreference {
  id               String              @id @default(cuid())
  userId           String
  channelType      ReminderChannelType
  enabled          Boolean             @default(true)
  scheduleConfig   Json?
  quietHoursConfig Json?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channelType])
  @@index([userId])
}

model Reminder {
  id                String              @id @default(cuid())
  userId            String
  relatedEntityType EntityType?
  relatedEntityId   String?
  title             String
  message           String?
  channelType       ReminderChannelType
  scheduledFor      DateTime?
  status            ReminderStatus      @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, channelType])
  @@index([userId, scheduledFor])
}

model Notification {
  id               String           @id @default(cuid())
  userId           String
  notificationType NotificationType
  title            String
  body             String?
  readAt           DateTime?
  metadata         Json?
  createdAt        DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, readAt])
  @@index([createdAt])
}

model BugReport {
  id             String            @id @default(cuid())
  reporterUserId String?
  title          String
  description    String
  status         BugReportStatus   @default(OPEN)
  severity       BugReportSeverity?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  reporter User? @relation("BugReportReporter", fields: [reporterUserId], references: [id], onDelete: SetNull)

  @@index([reporterUserId])
  @@index([status])
}

model FeatureFlag {
  id            String   @id @default(cuid())
  key           String   @unique
  description   String?
  enabled       Boolean  @default(false)
  audienceScope String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  actorUserId String?
  action      String
  targetType  String?
  targetId    String?
  metadata    Json?
  createdAt   DateTime @default(now())

  actor User? @relation("AuditLogActor", fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([actorUserId])
  @@index([createdAt])
}
```

## 4. Optional vs Required Fields Summary

### Required fields in core tracking

- `Dream.title`
- `Goal.title`
- `Habit.title`
- `Habit.frequencyType`
- `Task.title`
- `Reflection.body`
- all `userId` ownership fields on user-owned data

### Optional fields required by product flexibility

- `Goal.dreamId`
- `Dream.categoryId`
- `Goal.categoryId`
- `Habit.goalId`
- `Task.goalId`
- privacy-sensitive profile fields such as `gender`
- most measurement and scheduling fields until the user needs them

## 5. Primary Keys, Foreign Keys, Indexes, Constraints, and Enums

### Primary key strategy

Use `String @id @default(cuid())` across cloud tables.

Why:
- works well with Prisma
- easier for local-mode compatibility than database-only auto-increment IDs
- easier migration from local mode if the client also generates CUIDs

### Foreign key strategy

- always model explicit relations for core owned data
- use `onDelete: Cascade` for child records that should disappear with the parent user or parent definition
- use `onDelete: SetNull` for optional links like `goal.dreamId` and `reflection.weeklyReviewId`

### Important constraints

- `users.email` unique
- `users.username` unique
- `categories` unique by `[userId, name]`
- `auth_accounts` unique by `[provider, providerAccountId]`
- `sessions.sessionToken` unique
- `weekly_reviews` unique by `[userId, reviewWeekStart]`
- `reminder_preferences` unique by `[userId, channelType]`
- `feature_flags.key` unique

### Important indexes

- ownership queries on all major tables via `userId`
- status views on dreams, goals, habits, tasks
- time-based indexes on completions, notifications, activity events, audit logs
- relation lookups like `dreamId`, `goalId`, `weeklyReviewId`

### Enums

Use enums where values are truly controlled and low-volatility:
- roles
- statuses
- visibility
- reminder channel type
- notification type
- streak type
- bug report status/severity

Keep open-ended product labels like `goalType` as strings for MVP to avoid early migration churn.

## 6. Rules for Local Mode vs Cloud Mode Compatibility

### Core compatibility rule

The local browser store should use the same entity structure and the same ID format as the cloud database.

### Recommended local-mode rules

- generate CUID-like IDs in local mode too
- use the same enum labels and field names
- preserve relationships using the same foreign-key field names
- definitions must be migrated before event/history records

### Migration order from local to cloud

1. user account and profile
2. onboarding preferences
3. categories
4. dreams
5. goals
6. habits and tasks
7. completions and activity events
8. weekly reviews and reflections
9. reminders and notifications if present

### Important note

Local-only users do not need a `User` table row in the cloud until migration happens, but their local data should still mirror the same logical model.

## 7. Support for Future Social/Community Features Without Overengineering

Include only the minimum foundation needed:

- unique usernames
- `Profile.visibility`
- `Profile.allowDiscoverability`
- clean user-owned content boundaries
- activity and profile structures that can later support public views

Do not yet add:
- followers
- friends
- social graph tables
- public feed tables
- comments
- likes
- leaderboards
- messaging

This keeps the MVP schema clean while still avoiding a dead end.

## 8. Risky Design Decisions and Notes

### 1. JSON fields vs normalized tables

Risk:
- fields like `frequencyConfig`, `scheduleConfig`, `struggleAreas`, and `summarySnapshot` are flexible but can become messy.

Decision:
- acceptable for MVP where configuration is still evolving
- should be normalized later only if query or validation complexity grows

### 2. ActivityEvent polymorphism

Risk:
- `entityType` plus `entityId` is flexible but not as strictly relational as dedicated FKs.

Decision:
- good for MVP timeline and dashboard events
- should not be used as the only source of truth for domain actions

### 3. Streak as stored data

Risk:
- streak values can drift from the source history if update logic is buggy.

Decision:
- acceptable as cached/derived state for fast UI reads
- source history remains completions and activity records

### 4. Repeating tasks

Risk:
- repeating task logic can become complex fast.

Decision:
- keep `repeatType` minimal in MVP
- avoid advanced recurrence engines early

### 5. Decimal measurement model

Risk:
- different goal types may need different units and validation.

Decision:
- `measurementType` plus `targetValue/currentValue` is enough for MVP
- richer measurement modeling can wait

## 9. What to Keep Out of MVP

Keep these out of the MVP schema:

- social graph tables
- community feed ranking
- achievements economy
- badges and reward inventory systems
- monetization and billing models
- ad impression and ad reward systems
- moderation pipelines beyond lightweight admin placeholders
- full public-content publishing system
- advanced notification job orchestration tables unless truly needed

## 10. Final Recommendation

This schema is the strongest MVP balance between product flexibility, technical clarity, and future growth. It supports the required tracking experience, preserves history for streaks and reviews, stays compatible with local-first migration, and leaves room for future community features without bloating the first version.

