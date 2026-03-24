# Design Review Results: Dashboard, Goals, Dreams, Categories, Logs

**Review Date**: 2026-03-24  
**Routes**: `/dashboard.php`, `/goals.php`, `/dreams.php`, `/categories.php`, `/logs.php`  
**Focus Areas**: Visual Design · UX/Usability

---

## Summary

The app has a distinctive, cohesive terminal/hacker aesthetic that is well-executed and consistent. However, a critical UX risk exists with unguarded delete actions, and several usability friction points—including poor empty states, no edit affordance, raw JSON in logs, and an oversized mobile navigation—significantly reduce the day-to-day experience. Visual design issues are mostly polish-level: monospace fonts used globally, undifferentiated stat cards, and flat surface hierarchy.

---

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | **No confirmation before Delete** — Clicking "Delete" on Dream, Goal, or Category cards fires immediately with no dialog or undo. This is an irreversible, unguarded destructive action. | 🔴 Critical | UX/Usability | `src/views/dashboard/dreams.php:77`, `src/views/dashboard/goals.php:100`, `src/views/dashboard/categories.php:41` |
| 2 | **Raw JSON exposed in Activity Logs** — The `<pre class="log-details">` block prints raw JSON payloads (e.g. `{"ip":"::1"}`, `{"username":"reviewer","email":"reviewer@test.com"}`) directly to users. This is unreadable and surfaces internal data structure unnecessarily. | 🔴 Critical | UX/Usability | `src/views/dashboard/logs.php:32`, `src/assets/css/dashboard.css:459-466` |
| 3 | **Form label `::before` pseudo-element is not hidden from screen readers** — The CSS `label::before { content: ">" }` adds a decorative terminal prompt to every form label sitewide. Since it's a CSS pseudo-element on `<label>`, it is read aloud by screen readers as "greater-than sign E-mail", corrupting the label text. | 🔴 Critical | UX/Usability | `src/assets/css/auth.css:582-586` |
| 4 | **Empty states have no actionable CTA** — On Dreams, Goals, Categories, and Logs pages, when no data exists the empty state is just a plain paragraph of text. There is no icon/illustration, and no inline button to prompt the user to create their first item. The create button exists only in the page header which may be scrolled out of view. | 🟠 High | UX/Usability | `src/views/dashboard/dreams.php:39-41`, `src/views/dashboard/goals.php:47-50`, `src/views/dashboard/categories.php:26-30`, `src/assets/css/dashboard.css:293-303` |
| 5 | **No edit action on entity cards — only Delete** — Dream, Goal, and Category cards expose only a "Delete" button in their `*-actions` container. There is no "Edit" button. The intended pattern relies on clicking the card to open the workspace panel — but this affordance is completely invisible to the user (no tooltip, no cursor hint beyond CSS, no label). | 🟠 High | UX/Usability | `src/views/dashboard/dreams.php:76-78`, `src/views/dashboard/goals.php:99-101`, `src/views/dashboard/categories.php:40-43` |
| 6 | **Mobile navigation consumes ~40% of viewport** — At 390px, the sidebar converts to a vertically stacked nav block with loose grid spacing, taking up roughly 300px of screen height before any content appears. The Logout link is separated into a second disconnected block below the nav items, and its `> LOGOUT` prompt color (`#ffd4da`) is inconsistent with the rest of the nav. | 🟠 High | UX/Usability | `src/assets/css/dashboard.css:1032-1065`, `src/views/partials/dashboard-start.php:35-37`, `src/assets/css/dashboard.css:105-107` |
| 7 | **Selectable cards have no visual affordance** — Dream and Goal cards have class `selectable-card` and cursor `pointer`, but there is no label, icon, or visual cue to communicate "click to open detail panel". A new user has no way to discover this interaction. | 🟠 High | UX/Usability | `src/views/dashboard/dreams.php:44-45`, `src/assets/css/dashboard.css:329-330` |
| 8 | **Logs page has no filtering or search** — The Activity Logs page renders all logs as a flat reverse-chronological list. There is no date range filter, action-type filter, or search field. For any active user this becomes an unusable wall of entries with no way to navigate it. | 🟠 High | UX/Usability | `src/views/dashboard/logs.php:11-37` |
| 9 | **Monospace font applied to all text globally** — `--font-ui: "Consolas", "SFMono-Regular", "Liberation Mono", monospace` is set as the single global font and applied to every element including headings, body copy, and form labels. Monospace fonts have reduced readability at small sizes and in long-form copy. A sans-serif for body/labels paired with monospace for code/terminal elements would significantly improve legibility and feel more intentional. | 🟡 Medium | Visual Design | `src/assets/css/auth.css:17`, `src/assets/css/auth.css:31-43` |
| 10 | **Dashboard analytics summary grid: 3 items in 2-column layout** — `.analytics-summary-grid` is defined as `grid-template-columns: repeat(2, minmax(0, 1fr))` but contains 3 `analytics-summary-card` children (goals-summary, dreams-summary, recent-feed). The third card wraps to the next row full-width, creating an asymmetric layout that looks unintended. | 🟡 Medium | Visual Design | `src/assets/css/dashboard.css:534-538`, `src/views/dashboard/index.php:64-68` |
| 11 | **Stat cards on dashboard are visually identical** — All 4 stat cards (Total Dreams, Active Goals, Current Streak, Achievements) share the same card style with no icon, no accent color variation, and no visual differentiator beyond the label text. At a glance they look like the same repeated element rather than 4 distinct metrics. | 🟡 Medium | Visual Design | `src/views/dashboard/index.php:11-29`, `src/assets/css/dashboard.css:254-260` |
| 12 | **Progress bar has no border-radius** — `.progress-bar-container` and `.progress-bar` use hard `height: 6px` with no `border-radius`. The resulting sharp-edged bar looks visually rigid in a UI that otherwise uses subtle borders and gradients. A `border-radius: 3px` (or full pill) would harmonize with the design language. | 🟡 Medium | Visual Design | `src/assets/css/dashboard.css:440-450` |
| 13 | **Status badge values are raw lowercase enum strings** — Status badges display raw DB values: `active`, `paused`, `completed`, `abandoned`. They are not capitalized. While minor, this looks like a missing formatting step and reduces the polished feel of the cards. | 🟡 Medium | Visual Design | `src/views/dashboard/dreams.php:59`, `src/views/dashboard/goals.php:75` |
| 14 | **Surface levels are nearly indistinguishable** — The base background `#040806` and panel backgrounds (`rgba(9,19,13,0.64)`, `rgba(7,16,11,0.74)`, `rgba(4,10,7,0.82)`) differ only marginally in lightness. In practice, nested panels appear as one flat dark mass, making it hard to visually parse UI hierarchy, especially in the dashboard analytics area. | 🟡 Medium | Visual Design | `src/assets/css/dashboard.css:9-19`, `src/assets/css/dashboard.css:540-546` |
| 15 | **Logout link is orphaned on tablet layout (960px)** — When the sidebar collapses at 960px, nav items become a horizontal chip grid but Logout is still in a separate `.nav-bottom` row below them with its own `border-top` divider. This creates a disconnected layout that wastes vertical space and visually separates Logout from the nav context. | ⚪ Low | UX/Usability | `src/assets/css/dashboard.css:99-103`, `src/assets/css/dashboard.css:1032-1044` |
| 16 | **No breadcrumb or contextual orientation for entity relationships** — There is no visual indication of parent-child relationships (e.g., which Dream a Goal belongs to) beyond a small `goal-dream` label. On the Goals page, a user cannot tell at a glance which goals belong to which dream without reading each card. A grouping or breadcrumb structure would help. | ⚪ Low | UX/Usability | `src/views/dashboard/goals.php:78` |
| 17 | **Inline form composer appears without transition** — Clicking "+ New Dream/Goal/Category" toggles the `hidden` attribute on the `.inline-composer` section, causing it to appear abruptly with no animation. The rest of the UI uses `transition: 180ms ease` on interactive elements, so this jarring appearance is inconsistent. | ⚪ Low | Visual Design | `src/views/dashboard/dreams.php:12`, `src/assets/css/dashboard.css:216-218` |

---

## Criticality Legend

- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

---

## Next Steps (Prioritized)

1. **Fix immediately**: Add delete confirmation dialogs (#1) and parse JSON in logs (#2) and add `aria-hidden: true` equivalent to label `::before` (move to a `<span aria-hidden="true">` inside the label) (#3)
2. **High-value UX wins**: Enrich empty states with an inline CTA button (#4), add "Edit" buttons alongside "Delete" on all entity cards (#5), add a log filter bar (#8)
3. **Mobile polish**: Collapse mobile nav into a bottom tab bar or a hamburger-triggered drawer to recover content space (#6)
4. **Visual polish**: Introduce distinct icon/accent per stat card (#11), add `border-radius` to progress bars (#12), capitalize status badge text (#13), use `text-transform: capitalize` in `.status-badge`
5. **Typography**: Consider pairing a humanist sans-serif (e.g. Inter, Geist) for body text while keeping monospace for terminal/code decorative elements (#9)
