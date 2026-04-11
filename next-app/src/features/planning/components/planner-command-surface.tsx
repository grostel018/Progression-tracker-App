"use client";

import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/shared/workspace-shell";
import { ROUTES } from "@/constants/app";

type PlannerCommandSurfaceProps = {
  displayName: string;
  modeLabel: string;
  statusText: string;
  children: ReactNode;
};

const WORKSPACE_LINKS = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: "dashboard" },
  { href: ROUTES.planner, label: "Planner", icon: "goals" },
  { href: ROUTES.weeklyReview, label: "Weekly review", icon: "review" },
  { href: ROUTES.settings, label: "Settings", icon: "settings" }
] as const;

const PLANNER_SECTIONS = [
  { id: "goals", label: "Goals", icon: "goals" },
  { id: "goal-progress", label: "Selected goal", icon: "activity" },
  { id: "dreams", label: "Dreams", icon: "dreams" },
  { id: "categories", label: "Categories", icon: "categories" },
  { id: "habits", label: "Habits", icon: "sparkles" },
  { id: "tasks", label: "Tasks", icon: "star" }
] as const;

export function PlannerCommandSurface({
  displayName,
  modeLabel,
  statusText,
  children
}: PlannerCommandSurfaceProps): JSX.Element {
  return (
    <WorkspaceShell
      detailPanel={{
        title: "One goal should stay in focus.",
        body: "The planner still exposes dreams and categories, but the selected-goal lane is the place where execution should feel easiest to follow."
      }}
      displayName={displayName}
      modeLabel={modeLabel}
      sectionLabel="Planner quick access"
      sectionLinks={PLANNER_SECTIONS}
      statusText={statusText}
      workspaceLabel="Workspace"
      workspaceLinks={WORKSPACE_LINKS}
    >
      {children}
    </WorkspaceShell>
  );
}

