import { describe, expect, it } from "vitest";

import { buildGoalProgressSummary } from "@/features/planning/goal-progress";
import type { PlanningSnapshot } from "@/types/planning";

const snapshot: PlanningSnapshot = {
  categories: [],
  dreams: [],
  goals: [
    {
      id: "goal-1",
      title: "Train three times weekly",
      description: "",
      categoryId: null,
      dreamId: null,
      status: "ACTIVE",
      progressType: "TARGET_COUNT",
      targetDate: null,
      targetValue: 12,
      currentValue: 6,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-06T08:00:00.000Z"
    }
  ],
  goalLogs: [
    {
      id: "goal-log-1",
      goalId: "goal-1",
      loggedAt: "2026-04-04T08:00:00.000Z",
      progressValue: 4,
      note: "Momentum is back",
      createdAt: "2026-04-04T08:00:00.000Z",
      updatedAt: "2026-04-04T08:00:00.000Z"
    },
    {
      id: "goal-log-2",
      goalId: "goal-1",
      loggedAt: "2026-04-06T08:00:00.000Z",
      progressValue: 6,
      note: "Finished another workout",
      createdAt: "2026-04-06T08:00:00.000Z",
      updatedAt: "2026-04-06T08:00:00.000Z"
    }
  ],
  habits: [
    {
      id: "habit-1",
      goalId: "goal-1",
      title: "Workout",
      description: null,
      status: "ACTIVE",
      frequency: "DAILY",
      customDays: null,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-01T08:00:00.000Z"
    }
  ],
  tasks: [
    {
      id: "task-1",
      goalId: "goal-1",
      title: "Meal prep",
      description: null,
      status: "DONE",
      scheduledFor: null,
      completedAt: "2026-04-05T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-05T08:00:00.000Z"
    }
  ],
  habitCompletions: [
    {
      id: "habit-completion-1",
      habitId: "habit-1",
      completedFor: "2026-04-05",
      completedAt: "2026-04-05T08:00:00.000Z",
      createdAt: "2026-04-05T08:00:00.000Z"
    }
  ],
  taskCompletions: [
    {
      id: "task-completion-1",
      taskId: "task-1",
      completedAt: "2026-04-05T09:00:00.000Z",
      createdAt: "2026-04-05T09:00:00.000Z"
    }
  ]
};

describe("goal progress summary", () => {
  it("combines manual logs with linked habit and task proof inside a range", () => {
    const summary = buildGoalProgressSummary(snapshot, "goal-1", "MONTH", "2026-04-06");

    expect(summary).not.toBeNull();
    expect(summary?.entryCount).toBe(2);
    expect(summary?.filteredLogs).toHaveLength(2);
    expect(summary?.filteredEvents).toHaveLength(4);
    expect(summary?.filteredEvents[0]?.kind).toBe("goal-log");
    expect(summary?.linkedHabitCount).toBe(1);
    expect(summary?.linkedTaskCount).toBe(1);
    expect(summary?.filteredEvents.filter((event) => event.date === "2026-04-05")).toHaveLength(2);
  });
});
