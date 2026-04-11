# Progression Tracker Figma Spec

## Design Brief

- Visual thesis: a dark terminal workspace with restrained green phosphor accents, dense information, and enough glow and texture to feel intentional rather than nostalgic.
- Content plan: auth as a secure entry poster, dashboard as the command center, dreams and goals as active work surfaces, and secondary flows as lighter variants of the same shell.
- Interaction thesis: boot-in fade on entry, low-latency hover shifts on navigation and actions, and subtle status motion on progress bars and badges.

## Figma File Structure

Create one Figma page named `Product UI`.

Add these sections:

1. `00 Foundations`
2. `01 Components`
3. `02 Auth`
4. `03 Dashboard`
5. `04 Dreams`
6. `05 Goals`
7. `06 Extensions`

## Foundations

### Frame Setup

- Desktop base frame: `1440 x 1024`
- Tablet review frame: `1024 x 1366`
- Mobile frame: `390 x 844`
- Desktop outer padding: `24`
- Tablet outer padding: `20`
- Mobile outer padding: `12`

### Grid

- Desktop: `12 columns`, margin `24`, gutter `20`
- Tablet: `8 columns`, margin `20`, gutter `16`
- Mobile: `4 columns`, margin `12`, gutter `12`

### Spacing Scale

- `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 72, 96`

### Radius

- Panels: `0`
- Inputs: `0`
- Buttons: `0`
- Badges: `0`

This should feel terminal-sharp, not rounded SaaS.

## Tokens

Use the matching values from `figma-tokens.json`.

Core colors:

- Canvas: `#07110B`
- Canvas deep: `#020503`
- Panel glass: `rgba(8, 19, 13, 0.92)`
- Panel soft: `rgba(9, 19, 13, 0.64)`
- Border default: `rgba(101, 255, 166, 0.16)`
- Border strong: `rgba(101, 255, 166, 0.34)`
- Text primary: `#ECFFF1`
- Text muted: `rgba(211, 247, 221, 0.68)`
- Accent: `#6BFFB1`
- Accent strong: `#BBFFD5`
- Danger: `#FF7D90`
- Success: `#8DFFB8`
- Warning: `#FFD66D`
- Info: `#8CEFFF`

Effects:

- Main shadow: `0 28 90 0 rgba(0, 0, 0, 0.45)`
- Focus ring: `0 0 0 4 rgba(107, 255, 177, 0.08)`
- Top line accent: horizontal 1px gradient from transparent to accent to transparent

Background layers:

1. Base linear gradient from `#020503` to `#07110B` to `#040806`
2. Soft radial glow top-left using accent at `12%`
3. Soft radial glow bottom-right using accent at `8%`
4. Scanline overlay at `4px` spacing with very low opacity

Typography:

- Primary font: `Consolas`
- Fallback: `SF Mono`, `Liberation Mono`, `monospace`

Type scale:

- Display XL: `86 / 80 / -4%`
- Display L: `54 / 50 / -4%`
- Heading L: `44 / 42 / -4%`
- Heading M: `32 / 32 / -3%`
- Heading S: `20 / 24 / -1%`
- Body M: `16 / 24 / 0%`
- Body S: `14 / 20 / 0%`
- Label: `12 / 16 / 16% uppercase`
- Micro: `11 / 14 / 12% uppercase`

## Components

Build these as Figma components before drawing screens.

### App Shell

- Desktop shell width: full frame minus outer padding
- Style: dark glass panel with 1px strong border and large shadow
- Top accent line placed `18-24px` from the top edge
- Two regions:
  - Sidebar `270px`
  - Main content fluid

### Sidebar

- Brand line: `Progression Tracker` in label style accent text
- Username block under brand
- Navigation items stacked with `6px` visual rhythm
- Active item:
  - subtle accent wash
  - 1px border
  - text primary
  - tiny `+2px` x-offset in prototype hover state
- Logout item uses muted red text

### Primary Button

- Height `48`
- Fill gradient from accent to slightly darker accent
- Text color `#031108`
- Letter spacing `8%`
- Uppercase
- Hover prototype: lift `1px`, stronger glow

### Secondary Action Button

- Height `40`
- Transparent fill
- 1px border default
- Text muted by default, text primary on hover

### Input Field

- Height `52`
- Dark fill
- 1px default border
- Label above using label style
- Placeholder in 30% text opacity
- Focus variant with strong border and focus ring

### Status Badge

- Height `24`
- 1px border
- Uppercase micro text
- Variants:
  - Active: success green wash
  - Paused: warning wash
  - Completed: cyan wash
  - Failed or Abandoned: red wash

### Stat Block

- Min height `150`
- Top accent line
- Label top
- Large value
- Optional supporting unit

### Content Card

- Use for dream, goal, category, and log rows
- No border radius
- Background soft panel
- Top accent line
- Hover variant: slightly brighter panel, stronger border

## Screen Specs

## 02 Auth

### A1 Login Desktop

Frame: `1440 x 1024`

Layout:

- Center the shell vertically and horizontally
- Shell width: `min(1120, frame width - 48)`
- Two-column split:
  - Left intro: `~62%`
  - Right auth panel: `360-430px`

Left intro content:

- Kicker: `secure node // progress workspace`
- Title: `Progression Tracker`
- Subtitle: `Resume your streak and continue from the last checkpoint.`
- Bottom row of 3 status items:
  - Session / Encrypted
  - Sync / Dreams / Goals
  - Mode / Checkpoint Resume

Right panel content:

- Eyebrow: `Auth Access`
- Copy: `Resume active tracking and continue from the latest checkpoint.`
- Fields:
  - E-mail
  - Password
- Row:
  - Remember checkbox with `[ ]` style
  - Forgot password link
- Error area placeholder below options
- CTA: `> Login`
- Secondary line: `New user? Create an account`
- Footer copyright

### A2 Register Desktop

Use the same frame and shell.

Content changes:

- Kicker: `secure node // onboarding`
- Status row:
  - Workspace / Fresh Profile
  - Modules / Dreams / Goals / Logs
  - Output / Tracking Ready
- Panel eyebrow: `Node Setup`
- CTA: `> Register`
- Fields:
  - E-mail
  - Username
  - Password
  - Repeat Password
- Secondary line: `Already registered? Return to login`

### A3 Forgot Desktop

Same structure.

Content changes:

- Kicker: `secure node // recovery`
- Status row:
  - Recovery / Mail Link
  - Route / Verified Inbox
  - Access / Restore Session
- Panel eyebrow: `Recovery Access`
- Supporting text above email field
- CTA: `> Send Reset Link`
- Add success message style under error state

### A4 Auth Mobile

Frame: `390 x 844`

Changes:

- Stack intro above panel
- Reduce outer padding to `12`
- Title scales to `36-54`
- Status items become one-column list
- Form options stack vertically
- CTA full width

## 03 Dashboard

### D1 Dashboard Desktop

Frame: `1440 x 1024`

Use app shell component.

Sidebar:

- Brand
- Welcome line with username
- Nav:
  - Dashboard
  - Dreams
  - Goals
  - Categories
  - Logs
- Logout anchored near bottom

Main content:

- Page title: `Dashboard`
- Optional right action: keep empty for now or add `> New Goal`
- Stats row with 4 stat blocks:
  - Total Dreams
  - Active Goals
  - Current Streak
  - Achievements
- Main panel below:
  - Heading: `Your Progress Overview`
  - Supporting copy: concise operational copy, not marketing copy
  - Placeholder area for future chart or recent activity feed

Recommended improvement for Figma mock:

- Replace the single empty panel with a 2-column workspace:
  - Left: progress timeline or recent activity
  - Right: next actions list

### D2 Dashboard Mobile

Frame: `390 x 844`

Layout:

- Stack shell into single column
- Sidebar becomes top utility block
- Nav becomes 2-column chip-like list
- Stats stack vertically
- Main panel full width

## 04 Dreams

### DR1 Dreams List Desktop

Frame: `1440 x 1024`

Header:

- Title: `My Dreams`
- Primary action: `+ New Dream`

Content:

- Responsive 3-column content card grid
- Each card contains:
  - Dream title
  - Status badge top right
  - Optional description
  - Meta row:
    - Start date
    - Target date if available
  - Footer action: `Delete`

Card behavior:

- Hover: slight lift and brighter border
- Empty state variant:
  - centered copy
  - same panel treatment
  - no illustration needed

### DR2 Dream Create Modal

This is not in code yet, but include it in Figma as the next UX step.

Modal:

- Width `560`
- Same visual language as auth panel
- Fields:
  - Title
  - Description
  - Start date
  - Estimated finish date
  - Status select
- CTA row:
  - `> Save Dream`
  - `Cancel`

## 05 Goals

### G1 Goals List Desktop

Frame: `1440 x 1024`

Header:

- Title: `My Goals`
- Primary action: `+ New Goal`

Content:

- 2-column or 3-column card grid depending on frame width
- Each goal card contains:
  - Goal title
  - Goal type and status badge
  - Parent dream line: `in [dream title]`
  - Optional description
  - Progress bar
  - Meta row:
    - Start date
    - Target date
  - Footer action: `Delete`

Progress bar:

- Track height `6`
- Dark subtle track
- Accent fill left to right
- Optional small percentage text right aligned in an enhanced version

### G2 Goal Create Modal

Modal width `620`

Fields:

- Goal title
- Goal type
- Parent dream select
- Description
- Start date
- Estimated finish date
- Initial progress
- Status

CTA row:

- `> Save Goal`
- `Cancel`

### G3 Goals Mobile

Frame: `390 x 844`

Changes:

- Header stacks title and CTA
- Cards become single column
- Goal info aligns left under title
- Progress bar spans full card width

## 06 Extensions

Use these as optional additional frames so the full app system feels complete.

### E1 Categories List

- Same shell and page header
- Compact cards with:
  - Category name
  - Created timestamp
  - Dream count
  - Delete action

### E2 Activity Logs

- Vertical stack instead of grid
- Each log row includes:
  - Action
  - Timestamp
  - Target metadata
  - Optional code-block-like details area

### E3 Toasts and Feedback

Add a feedback component set:

- Success toast
- Error toast
- Inline form error
- Empty state panel

## Prototype Notes

In Figma prototype mode:

- Auth shell fades up from `y +24` over `300ms`
- Nav item hover and press moves right by `2px`
- Buttons move up by `1px` on hover
- Progress bars animate width on screen enter
- Modal overlays fade in at `200ms`

## Build Order In Figma

1. Set up local variables from `figma-tokens.json`
2. Build text styles
3. Build the shell, sidebar, button, input, badge, stat, and card components
4. Compose auth screens
5. Compose dashboard
6. Compose dreams and goals
7. Add mobile variants
8. Add modal and feedback states

## Notes For Consistency

- Do not round corners unless you intentionally want to break the terminal direction
- Do not add extra accent colors; keep green as the dominant system accent
- Avoid hero-card SaaS patterns inside the product UI
- Prefer layout and typography hierarchy over decorative chrome
- If a panel works without a border, remove the border; only keep it where scanning improves
