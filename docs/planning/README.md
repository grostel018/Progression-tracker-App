# Planning Documentation Index

This folder contains the product and implementation planning created from the product discovery work for the next-generation version of Progression Tracker.

These documents describe the proposed target product and future roadmap, not the exact code already implemented in `next-app/`.

## Important Distinction

Use these docs for:
- product direction
- architecture intent
- milestone sequencing
- planned MVP scope
- target database design

Do not use these docs alone as proof that a feature already exists in code.

For the current code-aligned implementation state, use:
- `../../next-app/README.md`
- `../../next-app/docs/CURRENT_IMPLEMENTATION_STATUS.md`
- `../../next-app/docs/CODEBASE_GAP_AUDIT.md`

## Documents

- `PRODUCT_PLAN.md`
  Product vision, target users, scope, product concepts, MVP definition, and non-functional requirements.

- `ARCHITECTURE_PROPOSAL.md`
  Recommended architecture, stack direction, module boundaries, folder structure, and scalability strategy.

- `IMPLEMENTATION_BACKLOG.md`
  Prioritized backlog with user stories and acceptance criteria.

- `MILESTONES.md`
  Logical milestone breakdown and implementation order.

- `ENGINEERING_IMPLEMENTATION_PLAN.md`
  Engineering-focused breakdown of milestones, tasks, dependencies, and risks.

- `MVP_DATABASE_SCHEMA.md`
  Target-state MVP schema proposal.

- `MVP_SITEMAP_AND_USER_FLOWS.md`
  Target-state screen and user-flow design.

## Recommended Reading Order

1. `PRODUCT_PLAN.md`
2. `ARCHITECTURE_PROPOSAL.md`
3. `IMPLEMENTATION_BACKLOG.md`
4. `MILESTONES.md`
5. `ENGINEERING_IMPLEMENTATION_PLAN.md`

## Notes

- The PRD created earlier remains available at `../PRODUCT_REQUIREMENTS.md`.
- This planning set remains useful, but it should now be read alongside the code-aligned implementation docs in `next-app/docs/`.
- The goal is to prevent planning documents from drifting into accidental implementation documentation.
