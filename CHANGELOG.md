# Changelog

## 2026-03-24

### UI and UX alignment

- Reworked the dashboard shell, page headers, and stat-card hierarchy to better match the app's terminal-inspired product direction.
- Replaced the oversized small-screen navigation block with a mobile bottom-tab pattern and integrated logout more cleanly across tablet and mobile layouts.
- Improved panel depth, summary-card readability, and overall surface hierarchy in the dashboard workspace.

### Entity flows and interaction fixes

- Added empty-state CTA actions for dashboard entity pages.
- Added inline confirmation for destructive entity actions so delete buttons no longer execute immediately.
- Added visible edit actions for dreams, goals, and categories.
- Parsed JSON activity-log details into readable key/value rows and added log filtering with live result counts.
- Added keyboard-accessible selection for dream and goal cards.

### Dream and goal form parity

- Expanded dream create/edit flows to support category, status, start date, target date, description, and current progress.
- Expanded goal create/edit flows to support dream, goal type, status, start date, target date, description, and current progress.
- Added client-side validation for progress ranges and date ordering so the UI now respects the backend model constraints more closely.
- Humanized enum-style values such as statuses and goal types in cards and workspace metadata.

### Goal workspace actions

- Added real edit flows for goal tasks and habits instead of exposing action labels that only partially worked.
- Unified inline confirmation behavior for task and habit deletion.
- Reset task and habit forms correctly when users switch goals or cancel edit mode.
- Kept history, task, and habit actions synchronized with the currently selected goal.

### Shared frontend logic

- Consolidated repeated frontend utilities for collapsible panels, inline confirmations, date helpers, and label humanization into the shared app runtime.
- Reduced duplicated interaction logic across categories, dreams, and goals so behavior is more consistent page to page.

### Session, cookie, and caching hardening

- Centralized session-cookie configuration in the shared runtime instead of relying on scattered session starts.
- Added stricter PHP session settings: cookie-only sessions, strict mode, trans-sid disabled, explicit lifetime, and normalized cookie parameters.
- Added `SameSite=Lax` session cookies and automatic `Secure` detection so local HTTP still works while HTTPS deployments get secure cookies.
- Improved logout so the session cookie is explicitly expired and a fresh session identifier is issued after sign-out.
- Applied no-store/no-cache headers to dynamic HTML responses, redirects, and JSON API responses.
- Added long-lived immutable cache headers for static assets in Apache so versioned CSS and JS can cache aggressively.

### Verification

- PHP lint passed on modified view and runtime files.
- JavaScript parse checks passed on modified frontend files.
- Updated source assets were synced to `public/assets`.
