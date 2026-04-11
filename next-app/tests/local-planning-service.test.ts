import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createLocalPlanningService } from "@/features/local-mode/planning-storage";
import { buildLocalRecordKey, LOCAL_RECORD_NAMESPACES } from "@/features/local-mode/storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("local planning service", () => {
  it("saves categories, dreams, goals, habits, and tasks and preserves their links across reloads", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-planner-${crypto.randomUUID()}`
    });
    const service = createLocalPlanningService(adapter);

    const afterCategory = await service.saveCategory({
      name: "Health",
      description: "Fitness and recovery"
    });
    const categoryId = afterCategory.categories[0]?.id;

    const afterDream = await service.saveDream({
      title: "Healthy body",
      categoryId,
      vision: "Feel strong and capable every day"
    });
    const dreamId = afterDream.dreams[0]?.id;

    const afterGoal = await service.saveGoal({
      title: "Lose 20 kilos",
      categoryId,
      dreamId,
      progressType: "TARGET_COUNT",
      targetValue: 20
    });
    const goalId = afterGoal.goals[0]?.id;

    const afterHabit = await service.saveHabit({
      title: "Workout",
      goalId,
      frequency: "CUSTOM",
      customDays: [1, 3, 5]
    });
    const afterTask = await service.saveTask({
      title: "Meal prep",
      goalId,
      scheduledFor: "2026-04-04"
    });

    expect(afterTask.categories).toHaveLength(1);
    expect(afterTask.dreams[0]?.categoryId).toBe(categoryId);
    expect(afterTask.goals[0]?.dreamId).toBe(dreamId);
    expect(afterHabit.habits[0]?.goalId).toBe(goalId);
    expect(afterTask.tasks[0]?.goalId).toBe(goalId);

    const reloaded = await service.getSnapshot();

    expect(reloaded.categories).toHaveLength(1);
    expect(reloaded.dreams).toHaveLength(1);
    expect(reloaded.goals).toHaveLength(1);
    expect(reloaded.habits).toHaveLength(1);
    expect(reloaded.tasks).toHaveLength(1);
    expect(reloaded.habitCompletions).toHaveLength(0);
    expect(reloaded.taskCompletions).toHaveLength(0);
  });

  it("supports edit, archive, and completion flows for habits and tasks", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-planner-actions-${crypto.randomUUID()}`
    });
    const service = createLocalPlanningService(adapter);

    const categorySnapshot = await service.saveCategory({ name: "Health" });
    const categoryId = categorySnapshot.categories[0]!.id;
    const goalSnapshot = await service.saveGoal({
      title: "Lose 20 kilos",
      categoryId,
      progressType: "TARGET_COUNT",
      targetValue: 20
    });
    const goalId = goalSnapshot.goals[0]!.id;
    const habitSnapshot = await service.saveHabit({
      title: "Workout",
      goalId,
      frequency: "DAILY"
    });
    const taskSnapshot = await service.saveTask({
      title: "Meal prep",
      goalId,
      scheduledFor: "2026-04-04"
    });
    const habitId = habitSnapshot.habits[0]!.id;
    const taskId = taskSnapshot.tasks[0]!.id;

    const afterHabitUpdate = await service.updateHabit({
      id: habitId,
      title: "Strength workout",
      goalId,
      frequency: "CUSTOM",
      customDays: [1, 3, 5]
    });
    const afterTaskUpdate = await service.updateTask({
      id: taskId,
      title: "Meal prep for the week",
      goalId,
      scheduledFor: "2026-04-05"
    });
    const afterHabitCompletion = await service.completeHabit({
      habitId,
      completedFor: "2026-04-04"
    });
    const afterTaskCompletion = await service.completeTask({ taskId });
    const afterHabitArchive = await service.archiveHabit(habitId);
    const afterTaskArchive = await service.archiveTask(taskId);

    expect(afterHabitUpdate.habits[0]?.title).toBe("Strength workout");
    expect(afterHabitUpdate.habits[0]?.customDays).toEqual([1, 3, 5]);
    expect(afterTaskUpdate.tasks[0]?.title).toBe("Meal prep for the week");
    expect(afterHabitCompletion.habitCompletions[0]?.habitId).toBe(habitId);
    expect(afterTaskCompletion.tasks[0]?.status).toBe("DONE");
    expect(afterTaskCompletion.taskCompletions[0]?.taskId).toBe(taskId);
    expect(afterHabitArchive.habits[0]?.status).toBe("ARCHIVED");
    expect(afterTaskArchive.tasks[0]?.status).toBe("ARCHIVED");
  });

  it("ignores malformed local planner records instead of crashing the snapshot", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-planner-bad-${crypto.randomUUID()}`
    });

    await adapter.write({
      key: buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goals, "broken"),
      value: {
        id: "broken",
        title: 123,
        updatedAt: "bad"
      },
      updatedAt: new Date().toISOString()
    });

    const service = createLocalPlanningService(adapter);
    const snapshot = await service.getSnapshot();

    expect(snapshot).toEqual({
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
});
