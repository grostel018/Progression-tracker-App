import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planning/repository", () => ({
  archiveCategoryRecord: vi.fn(async () => undefined),
  archiveDreamRecord: vi.fn(async () => undefined),
  archiveGoalRecord: vi.fn(async () => undefined),
  archiveHabitRecord: vi.fn(async () => undefined),
  archiveTaskRecord: vi.fn(async () => undefined),
  completeTaskRecord: vi.fn(async () => undefined),
  createCategoryRecord: vi.fn(async () => undefined),
  createDreamRecord: vi.fn(async () => undefined),
  createGoalRecord: vi.fn(async () => undefined),
  createHabitCompletionRecord: vi.fn(async () => undefined),
  createHabitRecord: vi.fn(async () => undefined),
  createTaskRecord: vi.fn(async () => undefined),
  findOwnedCategoryId: vi.fn(async () => null),
  findOwnedDreamId: vi.fn(async () => null),
  findOwnedGoalId: vi.fn(async () => null),
  getPlanningSnapshotForUser: vi.fn(async () => ({
    categories: [],
    dreams: [],
    goals: [],
    habits: [],
    tasks: [],
    habitCompletions: [],
    taskCompletions: []
  })),
  removeHabitCompletionRecord: vi.fn(async () => undefined),
  updateCategoryRecord: vi.fn(async () => undefined),
  updateDreamRecord: vi.fn(async () => undefined),
  updateGoalRecord: vi.fn(async () => undefined),
  updateHabitRecord: vi.fn(async () => undefined),
  updateTaskRecord: vi.fn(async () => undefined)
}));

vi.mock("@/features/planning/progress-repository", () => ({
  createGoalLogRecord: vi.fn(async () => undefined),
  deleteGoalLogRecord: vi.fn(async () => undefined),
  getGoalLogsForUser: vi.fn(async () => []),
  updateGoalLogRecord: vi.fn(async () => undefined)
}));

import { createCategory, createDream, createHabit, completeTask, updateGoal } from "@/features/planning/service";
import {
  completeTaskRecord,
  createCategoryRecord,
  createDreamRecord,
  createHabitRecord,
  findOwnedCategoryId,
  findOwnedDreamId,
  findOwnedGoalId,
  getPlanningSnapshotForUser,
  updateGoalRecord
} from "@/features/planning/repository";

describe("planning service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPlanningSnapshotForUser).mockResolvedValue({
      categories: [],
      dreams: [],
      goals: [],
      goalLogs: [],
      habits: [],
      tasks: [],
      habitCompletions: [],
      taskCompletions: []
    });
  });

  it("creates a category and returns the refreshed snapshot", async () => {
    await createCategory("user-1", {
      name: "Health",
      description: "Fitness"
    });

    expect(createCategoryRecord).toHaveBeenCalledWith("user-1", {
      name: "Health",
      description: "Fitness"
    });
    expect(getPlanningSnapshotForUser).toHaveBeenCalledWith("user-1");
  });

  it("rejects dreams linked to categories outside the user's workspace", async () => {
    vi.mocked(findOwnedCategoryId).mockResolvedValue(null);

    await expect(
      createDream("user-1", {
        title: "Healthy body",
        categoryId: "foreign-category"
      })
    ).rejects.toMatchObject({
      fieldErrors: {
        categoryId: "Choose a category from your workspace."
      }
    });

    expect(createDreamRecord).not.toHaveBeenCalled();
  });

  it("updates a goal with owned category and dream relations", async () => {
    vi.mocked(findOwnedCategoryId).mockResolvedValue("category-1");
    vi.mocked(findOwnedDreamId).mockResolvedValue("dream-1");

    await updateGoal("user-1", {
      id: "goal-1",
      title: "Lose 20 kilos",
      description: "Progress steadily",
      categoryId: "category-1",
      dreamId: "dream-1",
      progressType: "TARGET_COUNT",
      targetDate: "2026-08-01",
      targetValue: 20
    });

    expect(updateGoalRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ id: "goal-1", title: "Lose 20 kilos" }),
      "category-1",
      "dream-1"
    );
  });

  it("rejects habits linked to goals outside the user's workspace", async () => {
    vi.mocked(findOwnedGoalId).mockResolvedValue(null);

    await expect(
      createHabit("user-1", {
        title: "Workout",
        goalId: "foreign-goal",
        frequency: "DAILY"
      })
    ).rejects.toMatchObject({
      fieldErrors: {
        goalId: "Choose a goal from your workspace."
      }
    });

    expect(createHabitRecord).not.toHaveBeenCalled();
  });

  it("records task completion and refreshes the snapshot", async () => {
    await completeTask("user-1", { taskId: "task-1" });

    expect(completeTaskRecord).toHaveBeenCalledWith("user-1", { taskId: "task-1" });
    expect(getPlanningSnapshotForUser).toHaveBeenCalledWith("user-1");
  });
});
