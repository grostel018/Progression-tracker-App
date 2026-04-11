# Product Requirements Document

## Product Name

Progression Tracker

## Document Purpose

This document defines the product vision, user needs, MVP scope, feature requirements, constraints, and release boundaries for the first real version of Progression Tracker. It is intended to guide product decisions, design, architecture, and implementation.

## 1. Product Summary

Progression Tracker is a motivation-first progress tracking web app designed to help people stay disciplined, consistent, and focused while working toward meaningful personal objectives.

The app combines:

- long-term dreams
- concrete goals
- recurring habits
- actionable tasks
- streaks
- weekly reflection
- progress visibility
- guided onboarding

The product should feel modern, playful, polished, and youth-friendly while staying easy to use and not overwhelming.

## 2. Product Vision

Build a beautiful and intuitive progress tracking app that helps users stay on the path they want, improve every week, and feel more motivated through visible progress, personalized structure, and consistent tracking.

The app should not feel like a boring spreadsheet or checklist tool. It should feel like a motivating companion for self-improvement.

## 3. Business Goals

### Short-term goals

- launch a deployable and impressive web app within 3 months
- validate product interest with early users and testers
- create a product strong enough for real usage and portfolio value
- keep costs low for solo development

### Medium-term goals

- improve the app heavily over the next 6 months
- build a strong technical foundation that supports growth
- prepare for future social and monetization features

### Long-term goals

- evolve the app into a semi-social or community-based progress platform
- support premium features and monetization later
- expand to native mobile and desktop apps after the web product is mature

## 4. Success Criteria for Version 1

Version 1 will be considered successful if:

- the UI is beautiful, polished, modern, and intuitive
- new users can understand the app quickly without being overwhelmed
- users can create and track goals, habits, tasks, and dreams easily
- users can see meaningful progress and weekly improvement
- the app works well on phones first, then desktop and tablet
- the product is stable enough for early real-world testing

## 5. Target Users

### Primary audience

- mostly youth
- students
- athletes
- artists
- developers
- self-improvement oriented users

### Secondary audience traits

- users who want motivation and structure
- users who benefit from visible progress and routine tracking
- users who may want different styles of guidance and customization

### User characteristics

- mobile-first behavior
- interested in productivity, discipline, health, and self-improvement
- may want light personalization during onboarding

## 6. Core Product Principles

The product should be:

- motivating
- visually attractive
- easy to start
- powerful but not overwhelming
- flexible enough for different lifestyles
- privacy-aware
- secure by default
- scalable enough for future growth

## 7. Core Product Concepts

### Dream

A dream is a long-term aspiration.

Example:
- have a healthy body

Rules:
- a dream may exist without linked goals
- a dream may later contain one or more goals
- dreams represent higher-level intent and direction

### Goal

A goal is a concrete objective, usually more short-term than a dream.

Example:
- lose 20 kilos

Rules:
- a goal may exist without a dream
- a goal may later be linked to a dream
- goals may have a target date depending on type
- goals may have measurable progress depending on type

### Habit

A habit is a recurring action that supports growth or progress.

Example:
- workout

Rules:
- habits are repeatable over time
- habits should support frequency settings such as daily, weekdays, weekly, and custom schedules
- habits may also have a small streak of their own

### Task

A task is a detailed actionable item that helps a user complete progress toward a goal or routine.

Examples:
- drink 2.5L of water
- eat 100g of protein
- do 100 abs
- do 100 push ups

Rules:
- tasks are usually more specific than habits
- tasks are checkable items
- tasks can support daily execution or progress support

### Streak

A streak is a motivational measure of consistency.

Rules:
- the app should support a general streak system across activity
- habits may optionally have their own streak indicators too

## 8. Platform Strategy

### Version 1 platform

- responsive web application

### Priority order of device usage

1. phone
2. desktop
3. tablet

### Future platform plan

- native mobile apps later
- desktop apps later
- web remains the main foundation first

## 9. Account Strategy

The app should support both local-only use and cloud account use.

### Local mode

- users can use basic tracking without creating an account
- data remains on the device only
- no cross-device sync
- basic tracking features should be available

### Account mode

- users can create an account to sync across devices
- users can use email/password sign-in
- users can use Google sign-in
- users get access to account-linked features and future social features

### Migration requirement

- a user in local mode must be able to switch later to cloud mode
- local data must be migratable into the user account

### Auth requirements for V1

- email/password sign-up and sign-in
- Google sign-in
- password reset
- email verification
- multi-factor authentication can be postponed

## 10. High-Level User Journey

### First-time experience

1. user lands on a public marketing page
2. app explains what it does and what the user gains from it
3. user chooses either local mode or account mode
4. user completes a short personalization flow
5. user is required to create at least one goal
6. user is required to create at least one habit or task
7. user enters the dashboard
8. dashboard highlights a personalized focus area such as current streak or most-focused goal

### Ongoing usage

Users should be able to:

- mark habits done
- check off tasks
- view recent activity
- review progress
- update goals when appropriate
- reflect weekly
- manage categories and preferences

## 11. Personalization Requirements

The onboarding should ask a small number of questions to create a more engaging experience.

Potential onboarding fields:

- life area or focus area
- optional gender
- weaknesses or struggle areas
- UI preferences
- motivation preferences
- reminder preferences

Rules:
- do not ask too many questions
- enough questions should be asked to make the app feel personalized
- optional and sensitive fields must be handled carefully

## 12. Feature Scope

### Must-have features for MVP

- public landing page
- local mode and account mode choice
- onboarding and personalization
- dream creation and management
- goal creation and management
- task creation and tracking
- habit creation and tracking
- category or life-area organization
- progress dashboard
- activity/history display
- streak tracking
- weekly review flow
- optional journal or reflection support
- profile with avatar or profile picture
- dark mode
- notifications and reminder preferences
- email/password authentication
- Google sign-in
- password reset
- email verification
- admin and tester dashboard
- analytics and audit logging

### Nice-to-have after MVP

- deeper customization themes
- richer gamification
- social feed
- friends and competition
- group challenges
- premium plans
- ad-supported experiences
- native apps

## 13. Functional Requirements

### 13.1 Landing Page

The landing page must:

- explain clearly what the app does
- communicate motivation and value quickly
- encourage users to get started
- support both guest/local mode and account mode entry paths
- act as the public-facing marketing page

### 13.2 Dreams

Users must be able to:

- create a dream
- edit a dream
- delete a dream
- optionally assign goals to a dream later
- view a dream's progress context

### 13.3 Goals

Users must be able to:

- create a goal with or without attaching it to a dream
- edit and delete goals
- categorize goals
- optionally define target dates
- track measurable progress where appropriate
- see which goals are most focused or most active

### 13.4 Habits

Users must be able to:

- create recurring habits
- choose habit frequency
- mark habits done
- view habit history
- see habit consistency and streaks

### 13.5 Tasks

Users must be able to:

- create tasks
- check off tasks
- organize tasks around progress areas or goals
- review task completion history

### 13.6 Dashboard

The dashboard must:

- feel personalized
- highlight streaks
- highlight recent activity
- highlight the most-focused goal or current focus area
- summarize overall progress
- work well on mobile first

### 13.7 Weekly Review

Users must be able to:

- review their recent progress weekly
- see consistency and activity summaries
- optionally write reflections or journal-style notes
- understand whether they improved or slowed down

### 13.8 Categories

Users must be able to:

- create categories or life areas
- assign goals and dreams into categories where relevant
- use categories as organization and focus filters

### 13.9 Notifications and Motivation

Users should be able to opt in to reminders.

V1 notification and reminder support should include:

- in-app reminders
- email reminders
- browser notifications if permission is granted

Motivational UX should include:

- streak celebrations
- milestone celebrations
- encouraging empty states
- weekly prompts

### 13.10 Profile and Preferences

Users must be able to:

- upload a profile picture or avatar
- manage basic profile information
- manage reminder settings
- manage personalization settings
- use dark mode

### 13.11 Admin and Tester Dashboard

Admin and tester tools should include:

- user list
- reported bugs
- feature flags
- test account management
- analytics overview
- moderation placeholders

## 14. Social Scope for V1

The first version should not attempt to become a full social network.

However, the foundation may include:

- public profile readiness
- username support
- future-ready profile structure
- optional shareable progress features later

V1 should prioritize stability, maintainability, and core tracking quality.

## 15. Roles and Permissions

### User roles in V1

- local user
- registered user
- admin or tester

### Permission summary

Local users:
- basic tracking only on-device

Registered users:
- cloud sync
- account-linked profile
- future-ready access to social and account features

Admin or testers:
- faster access to test app behavior
- admin dashboard capabilities
- user and analytics visibility as permitted

## 16. Data Requirements

The system should store at minimum:

### User data

- email
- username
- optional gender
- profile picture or avatar
- preferences
- onboarding answers
- reminder settings
- account status

### Tracking data

- dreams
- goals
- habits
- tasks
- categories
- streaks
- progress history
- activity history
- reflections or journal entries

### System data

- audit logs
- analytics events
- tester/admin metadata
- reports or moderation placeholders

### Media data

- profile pictures or avatars
- image uploads where supported

## 17. Non-Functional Requirements

### Design and UX

The app must:

- feel playful and modern
- blend inspiration from Duolingo, Yazio, and Snapchat without copying them
- stay authentic and original
- support both energetic and calm experiences depending on context
- provide dark mode in V1
- feel polished and rich, not basic

### Performance

The app should:

- feel fast on mobile devices
- support early launch usage comfortably
- remain usable on average consumer devices

### Security

The app must:

- use secure authentication flows
- protect user data properly
- support email verification and password reset
- avoid exposing private data carelessly
- be designed with privacy and security in mind from the start

### Privacy

The app must:

- request permission for sensitive information
- avoid collecting unnecessary personal data
- treat optional identity fields as optional
- prepare for public-facing content controls later

### Legal and compliance awareness

The app should:

- use original branding and visuals
- avoid copyright infringement and copied assets
- avoid risky imitation of patented or protected features
- be developed with privacy and security awareness
- consider underage users carefully

### Cost constraints

The architecture and tooling should:

- stay affordable for a solo junior developer
- avoid unnecessary paid services in the early stage
- favor efficient and maintainable technologies

### Scalability

The app should:

- support launch traffic from about 5 to 1000 users
- be designed to grow toward around 10,000 users later
- allow future social and monetization features without complete rewrites

## 18. MVP Definition

### MVP objective

Deliver a polished, deployable, mobile-first web app that allows users to track progress meaningfully, stay motivated, and build consistency, while laying a strong foundation for future social and premium features.

### MVP included

- landing page
- local-first usage path
- account-based usage path
- onboarding personalization
- create and manage dreams
- create and manage goals
- create and manage habits
- create and manage tasks
- categories
- dashboard
- progress/activity history
- streak tracking
- weekly review
- optional reflections
- profile and avatar
- reminder preferences
- dark mode
- email/password auth
- Google auth
- password reset
- email verification
- admin and tester tools
- analytics and audit logging

### MVP excluded

- full social network
- friend system
- competitive leaderboard ecosystem
- paid plans
- ads
- native mobile apps
- desktop apps
- advanced moderation tools beyond placeholders
- full community marketplace or public content ecosystem

## 19. MVP User Stories

### User onboarding

- As a new user, I want to understand the app quickly so I know why it matters.
- As a new user, I want to choose local mode or account mode so I can start in the way that suits me.
- As a new user, I want a short personalization flow so the app feels tailored to me.

### Core tracking

- As a user, I want to create a goal so I can define a concrete objective.
- As a user, I want to create a dream so I can define a long-term aspiration.
- As a user, I want to link goals to dreams later so I am not forced into structure too early.
- As a user, I want to create habits and tasks so I can take practical action.
- As a user, I want to mark tasks and habits done so I can see momentum.

### Motivation and review

- As a user, I want to see my streak so I stay motivated.
- As a user, I want to see my most active or focused goal so I know where my energy is going.
- As a user, I want a weekly review so I can reflect and improve.
- As a user, I want optional journaling so I can capture personal insights.

### Account and sync

- As a local user, I want to use the app without creating an account.
- As a local user, I want to later upgrade to cloud mode without losing my data.
- As a registered user, I want my data to sync across devices.

### Admin and testing

- As an admin or tester, I want access to user and test tools so I can validate the app and improve it efficiently.

## 20. Release Roadmap

### Phase 1: Product and foundation

- finalize product scope
- define data model
- define local vs cloud strategy
- define design system direction
- define architecture

### Phase 2: Core MVP implementation

- landing page
- onboarding
- auth
- local mode
- dreams, goals, habits, tasks
- dashboard
- categories
- streaks
- weekly review
- profile and reminders

### Phase 3: Quality and launch readiness

- admin dashboard
- analytics
- testing improvements
- performance polish
- mobile polish
- deployment hardening

### Phase 4: Post-MVP evolution

- deeper personalization
- shareable progress
- social foundations
- monetization experiments
- native app planning

## 21. Open Questions for Later

These are intentionally deferred and do not block MVP definition:

- exact monetization structure
- full social architecture
- moderation depth for public content
- native app timeline
- advanced gamification mechanics
- long-term recommendation or coaching systems

## 22. Final MVP Statement

Progression Tracker V1 is a mobile-first, polished web app for personal progress tracking that allows users to define dreams and goals, build habits, complete tasks, maintain streaks, review progress weekly, and choose between local-only or cloud-based use, all within a motivating and visually rich experience designed for long-term growth.
