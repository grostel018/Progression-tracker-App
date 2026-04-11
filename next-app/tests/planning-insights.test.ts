import { describe, expect, it } from "vitest";

import { buildPlanningActivityInsights } from "@/features/planning/insights";
import type { PlanningSnapshot } from "@/types/planning";

function createEmptySnapshot(): PlanningSnapshot {
  return {
    categories: [],
    dreams: [],
    goals: [],
    habits: [],
    tasks: [],
    habitCompletions: [],
    taskCompletions: []
  };
}

describe("planning activity insights", () => {
  it("returns zeroed dashboard insight values for an empty snapshot", () => {
    const insights = buildPlanningActivityInsights(createEmptySnapshot(), "2026-04-04");

    expect(insights).toMatchObject({
      referenceDate: "2026-04-04",
      totalCompletionCount: 0,
      completionsToday: 0,
      habitCompletionsToday: 0,
      taskCompletionsToday: 0,
      completionsLast7Days: 0,
      activeDaysLast7: 0,
      currentStreakDays: 0,
      dueHabitsToday: 0,
      openTaskCount: 0,
      completedTaskCount: 0,
      topGoalTitle: null,
      topGoalCompletionCount: 0
    });
    expect(insights.recentActivity).toEqual([]);
  });

  it("derives streaks, due habits, open tasks, and top goal from mixed completion history", () => {
    const snapshot: PlanningSnapshot = {
      ...createEmptySnapshot(),
      goals: [
        {
          id: "goal-health",
          title: "Health goal",
          description: null,
          status: "ACTIVE",
          progressType: "TARGET_COUNT",
          targetDate: null,
          targetValue: 20,
          currentValue: 0,
          createdAt: "2026-03-01T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        },
        {
          id: "goal-focus",
          title: "Focus goal",
          description: null,
          status: "ACTIVE",
          progressType: "BINARY",
          targetDate: null,
          targetValue: null,
          currentValue: 0,
          createdAt: "2026-03-01T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      ],
      habits: [
        {
          id: "habit-1",
          title: "Workout",
          description: null,
          goalId: "goal-health",
          status: "ACTIVE",
          frequency: "DAILY",
          customDays: null,
          createdAt: "2026-03-01T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        },
        {
          id: "habit-2",
          title: "Deep work",
          description: null,
          goalId: "goal-focus",
          status: "ACTIVE",
          frequency: "WEEKDAYS",
          customDays: null,
          createdAt: "2026-03-01T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      ],
      tasks: [
        {
          id: "task-1",
          title: "Meal prep",
          description: null,
          goalId: "goal-health",
          status: "DONE",
          scheduledFor: "2026-04-04T00:00:00.000Z",
          completedAt: "2026-04-04T08:30:00.000Z",
          createdAt: "2026-04-03T10:00:00.000Z",
          updatedAt: "2026-04-04T08:30:00.000Z"
        },
        {
          id: "task-2",
          title: "Plan tomorrow",
          description: null,
          goalId: "goal-focus",
          status: "TODO",
          scheduledFor: "2026-04-05T00:00:00.000Z",
          completedAt: null,
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      ],
      habitCompletions: [
        {
          id: "hc-1",
          habitId: "habit-1",
          completedFor: "2026-04-04",
          completedAt: "2026-04-04T07:00:00.000Z",
          createdAt: "2026-04-04T07:00:00.000Z"
        },
        {
          id: "hc-2",
          habitId: "habit-2",
          completedFor: "2026-04-03",
          completedAt: "2026-04-03T19:00:00.000Z",
          createdAt: "2026-04-03T19:00:00.000Z"
        }
      ],
      taskCompletions: [
        {
          id: "tc-1",
          taskId: "task-1",
          completedAt: "2026-04-04T08:30:00.000Z",
          createdAt: "2026-04-04T08:30:00.000Z"
        }
      ]
    };

    const insights = buildPlanningActivityInsights(snapshot, "2026-04-04");

    expect(insights).toMatchObject({
      totalCompletionCount: 3,
      completionsToday: 2,
      habitCompletionsToday: 1,
      taskCompletionsToday: 1,
      completionsLast7Days: 3,
      activeDaysLast7: 2,
      currentStreakDays: 2,
      dueHabitsToday: 1,
      openTaskCount: 1,
      completedTaskCount: 1,
      topGoalTitle: "Health goal",
      topGoalCompletionCount: 2
    });
    expect(insights.recentActivity[0]).toMatchObject({
      kind: "task",
      title: "Meal prep"
    });
    expect(insights.recentActivity[1]).toMatchObject({
      kind: "habit",
      title: "Workout"
    });
  });

  it("breaks the streak when today has no activity even if earlier days were active", () => {
    const snapshot: PlanningSnapshot = {
      ...createEmptySnapshot(),
      habitCompletions: [
        {
          id: "hc-1",
          habitId: "habit-1",
          completedFor: "2026-04-03",
          completedAt: "2026-04-03T07:00:00.000Z",
          createdAt: "2026-04-03T07:00:00.000Z"
        }
      ]
    };

    const insights = buildPlanningActivityInsights(snapshot, "2026-04-04");

    expect(insights.currentStreakDays).toBe(0);
    expect(insights.activeDaysLast7).toBe(1);
    expect(insights.completionsToday).toBe(0);
  });
});

