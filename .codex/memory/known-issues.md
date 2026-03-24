# Known Issues

These are the repo-level hazards most likely to waste time in future sessions.

## Asset Sync Drift

`src/assets/` is the source, but browsers load `public/assets/`.

Impact:

- Editing only `public/assets/` is fragile.
- Editing only `src/assets/` without syncing can make it look like changes did not work.

## Legacy Duplicate Areas

The repo still contains old or reference-only copies:

- `home/`
- `legacy/`
- `public/login.html`, `public/register.html`, `public/forgot.html`
- `.codex/original-repo/`

Impact:

- Easy to patch the wrong file set if the active layer is not chosen deliberately.

## Password Reset Is Session-Scoped

The forgot-password flow verifies security answers, then stores the reset token and expiry in PHP session state instead of a database-backed token table.

Impact:

- Recovery only continues in the same browser session.
- There is no email token or cross-device reset flow.

## Existing Accounts May Lack Recovery Data

The schema supports security questions, and new registration can save answers, but older accounts may not have rows in `user_security_answers`.

Impact:

- Forgot-password can fail for existing users even when the code path is correct.

## SQL `sessions` Table Is Not The Runtime Session Store

The schema still has a `sessions` table, but current auth uses native PHP sessions stored under `var/sessions/`.

Impact:

- It is easy to assume session bugs are DB-related when the active storage is filesystem-based.

## No Automated Tests Or Dependency Tooling

No Composer manifest, package manifest, or test runner config is present.

Impact:

- Verification is manual and file-targeted.
- Large refactors need extra care because there is no safety net beyond linting/manual checks.
