# Logbook

Use this file as a short running history of decisions and meaningful changes that future sessions should know about.

## Entry Template

### YYYY-MM-DD

- Task:
- Files touched:
- Verification:
- Follow-up:

## Entries

### 2026-03-24

- Task: audited the current project state and refreshed the project-local `.codex` memory so future sessions start from the live architecture instead of stale assumptions
- Files touched: `.codex/CODEX.md`, `.codex/memory/architecture.md`, `.codex/memory/database.md`, `.codex/memory/workflow.md`, `.codex/memory/known-issues.md`, `.codex/logbook.md`
- Verification: compared `.codex` notes against current `public/`, `src/`, `config/`, `DB/`, `scripts/`, and Git state
- Follow-up: if the app starts using Composer, tests, DB-backed reset tokens, or a different active app layer, update `.codex` memory immediately

### 2026-03-22

- Task: continued the refactor by wiring goal progress logging, activity logging, and post-registration security question persistence
- Files touched: `src/api/auth/LoginHandler.php`, `src/api/auth/RegisterHandler.php`, `src/api/auth/SecurityQuestionHandler.php`, `src/api/categories/CategoryController.php`, `src/api/dreams/DreamController.php`, `src/api/goals/GoalController.php`, `src/api/goals/GoalLogController.php`, `src/api/goals/GoalRepository.php`, `src/views/dashboard/goals.php`, `src/views/dashboard/logs.php`, `src/assets/js/goals.js`, `public/api/goal-logs.php`, `public/assets/js/goals.js`
- Verification: ran `php -l` on all touched PHP files and `C:\xampp\php\php.exe scripts/sync-assets.php`
- Follow-up: forgot-password flow remains placeholder-only even though security-question setup and verification endpoints now exist

### 2026-03-23

- Task: replaced the placeholder forgot-password flow with email lookup -> security question verification -> password reset, and added runtime/default seeding for security questions
- Files touched: `src/api/auth/ForgotPasswordHandler.php`, `src/api/auth/ResetPasswordHandler.php`, `src/api/auth/SecurityQuestionHandler.php`, `src/views/auth/forgot.php`, `src/assets/js/auth.js`, `src/assets/css/auth.css`, `DB/database.sql`, `public/assets/js/auth.js`, `public/assets/css/auth.css`
- Verification: ran `php -l` on touched PHP files and `C:\xampp\php\php.exe scripts/sync-assets.php`
- Follow-up: exercise the flow against the real local database to confirm existing accounts actually have rows in `user_security_answers`

### 2026-03-21

- Task: created a project-local `.codex` memory scaffold for Codex sessions
- Files touched: `.codex/CODEX.md`, `.codex/memory/architecture.md`, `.codex/memory/database.md`, `.codex/memory/workflow.md`, `.codex/memory/known-issues.md`, `.codex/logbook.md`
- Verification: compared notes against current `public/`, `src/`, `config/`, `DB/`, `README.md`, and `.claude/`
- Follow-up: keep these notes updated whenever the active app layer, schema, or bootstrapping approach changes
