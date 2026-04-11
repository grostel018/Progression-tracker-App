import { describe, expect, it } from "vitest";

import { buildWeeklyReviewInsights } from "@/features/weekly-review/insights";
import type { PlanningSnapshot } from "@/types/planning";

const snapshot: PlanningSnapshot = {
  categories: [],
  dreams: [],
  goals: [
    {
      id: "goal-1",
      title: "Lose 20 kilos",
      status: "ACTIVE",
      progressType: "TARGET_COUNT",
      currentValue: 0,
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-04-04T08:00:00.000Z"
    }
  ],
  habits: [
    {
      id: "habit-1",
      goalId: "goal-1",
      title: "Workout",
      status: "ACTIVE",
      frequency: "DAILY",
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-04-04T08:00:00.000Z"
    }
  ],
  tasks: [
    {
      id: "task-1",
      goalId: "goal-1",
      title: "Meal prep",
      status: "DONE",
      completedAt: "2026-04-03T10:00:00.000Z",
      scheduledFor: "2026-04-03T07:00:00.000Z",
      createdAt: "2026-04-01T07:00:00.000Z",
      updatedAt: "2026-04-03T10:00:00.000Z"
    },
    {
      id: "task-2",
      goalId: "goal-1",
      title: "Buy groceries",
      status: "TODO",
      completedAt: null,
      scheduledFor: "2026-04-04T07:00:00.000Z",
      createdAt: "2026-04-02T07:00:00.000Z",
      updatedAt: "2026-04-02T07:00:00.000Z"
    }
  ],
  habitCompletions: [
    {
      id: "hc-1",
      habitId: "habit-1",
      completedFor: "2026-03-30",
      completedAt: "2026-03-30T08:00:00.000Z",
      createdAt: "2026-03-30T08:00:00.000Z"
    },
    {
      id: "hc-2",
      habitId: "habit-1",
      completedFor: "2026-04-01",
      completedAt: "2026-04-01T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z"
    },
    {
      id: "hc-3",
      habitId: "habit-1",
      completedFor: "2026-04-03",
      completedAt: "2026-04-03T08:00:00.000Z",
      createdAt: "2026-04-03T08:00:00.000Z"
    }
  ],
  taskCompletions: [
    {
      id: "tc-1",
      taskId: "task-1",
      completedAt: "2026-04-03T10:00:00.000Z",
      createdAt: "2026-04-03T10:00:00.000Z"
    }
  ]
};

describe("weekly review insights", () => {
  it("aggregates the current week into a review summary, wins, and missed areas", () => {
    const insights = buildWeeklyReviewInsights(snapshot, "2026-04-04");

    expect(insights.weekStart).toBe("2026-03-30");
    expect(insights.weekEnd).toBe("2026-04-05");
    expect(insights.totalCompletions).toBe(4);
    expect(insights.habitCompletions).toBe(3);
    expect(insights.taskCompletions).toBe(1);
    expect(insights.activeDays).toBe(3);
    expect(insights.scheduledHabitCount).toBe(6);
    expect(insights.missedHabitCount).toBe(3);
    expect(insights.openTaskCount).toBe(1);
    expect(insights.openScheduledTaskCount).toBe(1);
    expect(insights.currentStreakDays).toBe(0);
    expect(insights.topGoalTitle).toBe("Lose 20 kilos");
    expect(insights.days).toHaveLength(7);
    expect(insights.recentActivity[0]?.title).toBe("Meal prep");
    expect(insights.wins).toContain("You logged 4 actions this week.");
    expect(insights.missedAreas).toContain("3 scheduled habit checks were missed so far this week.");
  });

  it("falls back to guidance when the current week has no activity yet", () => {
    const emptyInsights = buildWeeklyReviewInsights({
      ...snapshot,
      habitCompletions: [],
      taskCompletions: [],
      tasks: []
    }, "2026-04-04");

    expect(emptyInsights.totalCompletions).toBe(0);
    expect(emptyInsights.wins).toEqual(["The week is still open. One real action is enough to seed the next review."]);
    expect(emptyInsights.missedAreas).toContain("No activity has been recorded yet this week.");
  });
});
