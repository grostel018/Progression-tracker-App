import { describe, expect, it } from "vitest";

import { getMinimumSetupStateFromCounts, getMinimumSetupStateFromPlanningSnapshot, getWorkspaceReadinessState } from "@/features/workspace/state";

describe("workspace readiness state", () => {
  it("requires both a goal and at least one habit or task", () => {
    expect(getMinimumSetupStateFromCounts({ goals: 0, habits: 1, tasks: 0 })).toMatchObject({
      isComplete: false,
      missingGoal: true,
      missingAction: false
    });

    expect(getMinimumSetupStateFromCounts({ goals: 1, habits: 0, tasks: 0 })).toMatchObject({
      isComplete: false,
      missingGoal: false,
      missingAction: true
    });

    expect(getMinimumSetupStateFromCounts({ goals: 1, habits: 1, tasks: 0 })).toMatchObject({
      isComplete: true,
      missingGoal: false,
      missingAction: false
    });
  });

  it("ignores archived planner records when deriving the local minimum setup state", () => {
    const state = getMinimumSetupStateFromPlanningSnapshot({
      categories: [],
      dreams: [],
      goals: [{ id: "goal-1", status: "ACTIVE" }],
      habits: [{ id: "habit-1", status: "ARCHIVED" }],
      tasks: [{ id: "task-1", status: "TODO" }],
      habitCompletions: [],
      taskCompletions: []
    } as never);

    expect(state.isComplete).toBe(true);
    expect(state.counts).toEqual({ goals: 1, habits: 0, tasks: 1 });
  });

  it("combines onboarding completion with the minimum setup gate", () => {
    const readiness = getWorkspaceReadinessState({
      onboarding: { completedAt: "2026-04-04T10:00:00.000Z" },
      counts: { goals: 1, habits: 0, tasks: 1 }
    });

    expect(readiness.onboardingComplete).toBe(true);
    expect(readiness.minimumSetupComplete).toBe(true);
  });
});
