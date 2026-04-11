import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planning/service", () => ({
  getCloudPlanningSnapshot: vi.fn(async () => ({
    categories: [],
    dreams: [],
    goals: [],
    habits: [],
    tasks: [],
    habitCompletions: [],
    taskCompletions: []
  }))
}));

vi.mock("@/features/weekly-review/repository", () => ({
  listWeeklyReviewsForUser: vi.fn(async () => []),
  upsertWeeklyReviewRecord: vi.fn(async () => ({
    id: "review-1",
    weekStart: "2026-03-30",
    weekEnd: "2026-04-05",
    reflection: "Keep going",
    summarySnapshot: {
      referenceDate: "2026-04-04",
      weekStart: "2026-03-30",
      weekEnd: "2026-04-05",
      totalCompletions: 0,
      habitCompletions: 0,
      taskCompletions: 0,
      activeDays: 0,
      scheduledHabitCount: 0,
      missedHabitCount: 0,
      completedTaskCount: 0,
      openTaskCount: 0,
      openScheduledTaskCount: 0,
      currentStreakDays: 0,
      topGoalTitle: null,
      wins: [],
      missedAreas: []
    },
    completedAt: "2026-04-04T08:00:00.000Z",
    createdAt: "2026-04-04T08:00:00.000Z",
    updatedAt: "2026-04-04T08:00:00.000Z"
  }))
}));

import { getCloudPlanningSnapshot } from "@/features/planning/service";
import { listWeeklyReviewsForUser, upsertWeeklyReviewRecord } from "@/features/weekly-review/repository";
import { getCloudWeeklyReviewWorkspace, saveCloudWeeklyReview } from "@/features/weekly-review/service";

describe("weekly review service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCloudPlanningSnapshot).mockResolvedValue({
      categories: [],
      dreams: [],
      goals: [],
      habits: [],
      tasks: [],
      habitCompletions: [],
      taskCompletions: []
    });
    vi.mocked(listWeeklyReviewsForUser).mockResolvedValue([]);
  });

  it("returns the current review workspace from cloud data", async () => {
    const workspace = await getCloudWeeklyReviewWorkspace("user-1");

    expect(workspace.insights.weekStart).toBeTruthy();
    expect(workspace.currentReview).toBeNull();
    expect(listWeeklyReviewsForUser).toHaveBeenCalledWith("user-1");
  });

  it("saves the current review summary and reloads the workspace", async () => {
    const workspace = await getCloudWeeklyReviewWorkspace("user-1");

    await saveCloudWeeklyReview("user-1", {
      weekStart: workspace.insights.weekStart,
      reflection: "Showed up enough to keep momentum."
    });

    expect(upsertWeeklyReviewRecord).toHaveBeenCalledWith(
      "user-1",
      {
        weekStart: workspace.insights.weekStart,
        reflection: "Showed up enough to keep momentum."
      },
      expect.objectContaining({
        weekStart: workspace.insights.weekStart,
        weekEnd: workspace.insights.weekEnd
      })
    );
  });
});
