# Product Plan

## 1. Product Overview

Progression Tracker is a motivation-first progress tracking app designed to help people stay disciplined, consistent, and focused while pursuing meaningful personal objectives.

The product is intended to be:

- modern
- playful
- polished
- visually rich
- easy to start
- strong on mobile
- motivating without being overwhelming

The app should help users not only track progress, but also feel guided, engaged, and supported in improving week after week.

## 2. Problem Statement

Many people want to improve their lives but struggle with consistency, motivation, and clarity. They often lack a structure that connects long-term aspirations with day-to-day action.

Progression Tracker aims to solve this by helping users:

- define what they want
- break progress into manageable actions
- stay motivated through streaks and visible activity
- review improvement over time
- personalize the experience to fit their lifestyle

## 3. Product Vision

Build a beautiful and intuitive progress tracking platform that helps users stay on the path they want, improve weekly, and feel motivated through visible progress, personalized structure, and a strong emotional user experience.

The app should not feel like a generic productivity tracker. It should feel like a motivating companion for self-improvement.

## 4. Target Users

### Primary audience

- mostly youth
- students
- athletes
- artists
- developers
- self-improvement oriented users

### Product assumptions about users

- mobile-first usage is likely dominant
- users want a rich but simple experience
- users benefit from personalization and visible momentum
- some users want to start immediately without making an account

## 5. Product Goals

### User goals

- stay motivated and disciplined
- track objectives and progress clearly
- improve weekly
- connect daily actions to bigger ambitions

### Business goals

- launch a deployable web app in roughly 3 months
- validate product interest with early users and testers
- build a strong portfolio- and startup-quality product
- prepare for future social, premium, and cross-platform evolution

## 6. Core Product Concepts

### Dream

A dream is a long-term aspiration.

Example:
- have a healthy body

Rules:
- can exist without goals
- may later contain one or more goals
- represents a higher-level direction

### Goal

A goal is a more concrete and often shorter-term objective.

Example:
- lose 20 kilos

Rules:
- can exist without a dream
- may later be linked to a dream
- may support measurable progress and target dates depending on type

### Habit

A habit is a recurring action that supports growth or consistency.

Example:
- workout

Rules:
- repeatable over time
- supports frequency settings
- may have a streak of its own

### Task

A task is a detailed actionable item.

Examples:
- drink 2.5L of water
- eat 100g of protein
- do 100 abs
- do 100 push ups

Rules:
- more detailed than habits
- usually checkable/completable
- may support goals or routines

### Streak

A streak is a consistency measure used as motivation.

Rules:
- app should support a general streak
- habit-level streaks may also exist

## 7. Platform Strategy

### MVP platform

- responsive web app

### Device priority

1. phone
2. desktop
3. tablet

### Future direction

- native mobile apps later
- desktop apps later
- web remains the main foundation first

## 8. Account Strategy

The app should support both local-only and cloud-based use.

### Local mode

- basic tracking available without account creation
- data stored only on the current device
- no sync across devices

### Account mode

- email/password sign-in
- Google sign-in
- password reset
- email verification
- synced data across devices
- future-ready foundation for social features

### Migration requirement

- local users must be able to upgrade later to cloud mode
- local data must be migrated into the account

## 9. First-Time User Flow

1. user lands on a public marketing page
2. app explains what it does and what value it provides
3. user chooses local mode or account mode
4. user completes a short personalization flow
5. user is required to create at least one goal
6. user is required to create at least one habit or task
7. user reaches a personalized dashboard
8. dashboard highlights current streak or most-focused goal

## 10. Personalization Inputs

The onboarding may collect:

- life area or focus area
- optional gender
- weaknesses or struggle areas
- UI preference
- motivation preference
- reminder preference

Rules:
- must stay lightweight
- enough to make the app feel personalized
- sensitive fields must remain optional

## 11. MVP Scope

### Included in MVP

- landing page
- local mode and cloud account choice
- onboarding and personalization
- dreams
- goals
- habits
- tasks
- categories/life areas
- dashboard
- activity history
- streak tracking
- weekly review
- optional reflection/journaling
- profile and avatar
- dark mode
- notifications and reminder preferences
- email/password auth
- Google auth
- password reset
- email verification
- admin/tester dashboard
- analytics and audit logging

### Excluded from MVP

- full social network
- friend graph
- community feed
- paid plans
- ads
- native mobile apps
- desktop apps
- advanced moderation systems

## 12. Design Direction

The visual and UX direction should blend inspiration from:

- Duolingo for playfulness
- Yazio for polish and clarity
- Snapchat for youth-oriented energy

Design goals:

- energetic when celebrating progress
- calm and focused during tracking flows
- modern and premium-feeling
- authentic, not copied
- dark mode supported from V1

## 13. Roles

### User roles planned for V1

- local user
- registered user
- admin/tester

### Admin/tester needs

- user list
- analytics overview
- bug and test visibility
- feature flags
- test account tools
- moderation placeholders

## 14. Data to Store

### User-related data

- account credentials
- username
- optional gender
- profile picture/avatar
- preferences
- onboarding answers
- reminder preferences
- account status

### Progress-related data

- dreams
- goals
- habits
- tasks
- categories
- streaks
- activity history
- progress history
- weekly reviews
- reflections

### System-related data

- audit logs
- analytics events
- admin/tester metadata
- future moderation placeholders

## 15. Non-Functional Requirements

### UX and design

- polished and modern
- mobile-first
- easy to understand quickly
- rich but not overwhelming

### Security and privacy

- secure authentication
- proper password handling
- email verification and reset support
- careful handling of optional and sensitive fields
- privacy-aware design from day one

### Cost and practicality

- low-cost infrastructure in early stages
- efficient choices suitable for solo development
- strong foundation without overengineering

### Scalability

- support launch usage from around 5 to 1000 users
- grow toward around 10,000 users later
- avoid a design that requires total rewrites for future social or premium features

## 16. Final Product Statement

Progression Tracker V1 is a polished, mobile-first web app that helps users define dreams and goals, complete habits and tasks, maintain streaks, review weekly progress, and choose between local-only or cloud-based usage, all within a motivating and visually strong experience designed for future growth.
