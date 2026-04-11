import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createLocalGoalProgressService } from "@/features/local-mode/progress-storage";
import { createLocalPlanningService } from "@/features/local-mode/planning-storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("local goal progress service", () => {
  it("creates, updates, and deletes manual goal logs while syncing goal progress", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-goal-progress-${crypto.randomUUID()}`
    });
    const planningService = createLocalPlanningService(adapter);
    const progressService = createLocalGoalProgressService(adapter);

    const categorySnapshot = await planningService.saveCategory({ name: "Health" });
    const goalSnapshot = await planningService.saveGoal({
      title: "Train three times weekly",
      categoryId: categorySnapshot.categories[0]?.id,
      progressType: "TARGET_COUNT",
      targetValue: 12
    });
    const goalId = goalSnapshot.goals[0]!.id;

    const firstLogSnapshot = await progressService.saveGoalLog({
      goalId,
      loggedAt: "2026-04-04",
      progressValue: 3,
      note: "Good start"
    });
    const goalLogId = firstLogSnapshot.goalLogs?.[0]?.id;

    expect(firstLogSnapshot.goalLogs).toHaveLength(1);
    expect(firstLogSnapshot.goals[0]?.currentValue).toBe(3);

    const updatedSnapshot = await progressService.saveGoalLog({
      id: goalLogId!,
      goalId,
      loggedAt: "2026-04-05",
      progressValue: 5,
      note: "Even better"
    });

    expect(updatedSnapshot.goalLogs?.[0]?.progressValue).toBe(5);
    expect(updatedSnapshot.goals[0]?.currentValue).toBe(5);

    const afterDelete = await progressService.deleteGoalLog({
      id: goalLogId!,
      goalId
    });

    expect(afterDelete.goalLogs).toHaveLength(0);
    expect(afterDelete.goals[0]?.currentValue).toBe(0);
  });
});
