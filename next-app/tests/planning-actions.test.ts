import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(async () => ({
    kind: "cloud",
    user: { id: "user-1" }
  }))
}));

const emptySnapshot = {
  categories: [],
  dreams: [],
  goals: [],
  habits: [],
  tasks: [],
  habitCompletions: [],
  taskCompletions: []
};

vi.mock("@/features/planning/service", () => ({
  archiveCategory: vi.fn(async () => emptySnapshot),
  archiveDream: vi.fn(async () => emptySnapshot),
  archiveGoal: vi.fn(async () => emptySnapshot),
  archiveHabit: vi.fn(async () => emptySnapshot),
  archiveTask: vi.fn(async () => emptySnapshot),
  completeHabit: vi.fn(async () => emptySnapshot),
  completeTask: vi.fn(async () => emptySnapshot),
  createCategory: vi.fn(async () => emptySnapshot),
  createDream: vi.fn(async () => emptySnapshot),
  createGoal: vi.fn(async () => emptySnapshot),
  createHabit: vi.fn(async () => emptySnapshot),
  createTask: vi.fn(async () => emptySnapshot),
  removeHabitCompletion: vi.fn(async () => emptySnapshot),
  updateCategory: vi.fn(async () => emptySnapshot),
  updateDream: vi.fn(async () => emptySnapshot),
  updateGoal: vi.fn(async () => emptySnapshot),
  updateHabit: vi.fn(async () => emptySnapshot),
  updateTask: vi.fn(async () => emptySnapshot)
}));

import { PlanningInputError } from "@/features/planning/errors";
import { PLANNING_ACTION_INITIAL_STATE } from "@/features/planning/types";
import {
  archiveDreamAction,
  completeTaskAction,
  saveCategoryAction,
  saveGoalAction,
  saveHabitAction
} from "@/features/planning/actions/cloud";
import { getSession } from "@/lib/auth/session";
import { archiveDream, createCategory, completeTask, updateGoal, updateHabit } from "@/features/planning/service";

describe("planning actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      kind: "cloud",
      user: { id: "user-1" }
    } as never);
  });

  it("creates a category from form data", async () => {
    const formData = new FormData();
    formData.set("name", "Health");
    formData.set("description", "Fitness");

    const result = await saveCategoryAction(PLANNING_ACTION_INITIAL_STATE, formData);

    expect(createCategory).toHaveBeenCalledWith("user-1", {
      name: "Health",
      description: "Fitness"
    });
    expect(result.status).toBe("success");
  });

  it("returns field errors when goal saving hits a planner validation error", async () => {
    vi.mocked(updateGoal).mockRejectedValue(
      new PlanningInputError("Choose a dream from your workspace.", {
        dreamId: "Choose a dream from your workspace."
      })
    );

    const formData = new FormData();
    formData.set("id", "goal-1");
    formData.set("title", "Lose 20 kilos");
    formData.set("description", "Progress steadily");
    formData.set("dreamId", "foreign-dream");
    formData.set("categoryId", "");
    formData.set("progressType", "TARGET_COUNT");
    formData.set("targetValue", "20");
    formData.set("targetDate", "2026-08-01");

    const result = await saveGoalAction(PLANNING_ACTION_INITIAL_STATE, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.dreamId).toBe("Choose a dream from your workspace.");
  });

  it("archives a dream for signed-in users", async () => {
    const formData = new FormData();
    formData.set("id", "dream-1");

    const result = await archiveDreamAction(PLANNING_ACTION_INITIAL_STATE, formData);

    expect(archiveDream).toHaveBeenCalledWith("user-1", "dream-1");
    expect(result.status).toBe("success");
  });

  it("updates a custom habit using submitted custom days", async () => {
    const formData = new FormData();
    formData.set("id", "habit-1");
    formData.set("title", "Workout");
    formData.set("goalId", "goal-1");
    formData.set("frequency", "CUSTOM");
    formData.append("customDays", "1");
    formData.append("customDays", "3");
    formData.append("customDays", "5");

    const result = await saveHabitAction(PLANNING_ACTION_INITIAL_STATE, formData);

    expect(updateHabit).toHaveBeenCalledWith("user-1", {
      id: "habit-1",
      title: "Workout",
      description: "",
      goalId: "goal-1",
      frequency: "CUSTOM",
      customDays: [1, 3, 5]
    });
    expect(result.status).toBe("success");
  });

  it("completes a task for signed-in users", async () => {
    const formData = new FormData();
    formData.set("taskId", "task-1");

    const result = await completeTaskAction(PLANNING_ACTION_INITIAL_STATE, formData);

    expect(completeTask).toHaveBeenCalledWith("user-1", { taskId: "task-1" });
    expect(result.status).toBe("success");
  });
});
