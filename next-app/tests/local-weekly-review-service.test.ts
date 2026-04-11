import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createLocalPlanningService } from "@/features/local-mode/planning-storage";
import { createLocalWeeklyReviewService } from "@/features/local-mode/weekly-review-storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("local weekly review service", () => {
  it("stores and reloads weekly reviews in the same local workspace", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-weekly-review-${crypto.randomUUID()}`
    });
    const planningService = createLocalPlanningService(adapter);
    const weeklyReviewService = createLocalWeeklyReviewService(adapter);

    const workspace = await weeklyReviewService.getWorkspace();
    const completionDate = workspace.insights.referenceDate;

    const goalSnapshot = await planningService.saveGoal({
      title: "Lose 20 kilos",
      progressType: "TARGET_COUNT",
      targetValue: 20
    });
    const goalId = goalSnapshot.goals[0]!.id;
    const habitSnapshot = await planningService.saveHabit({
      title: "Workout",
      goalId,
      frequency: "DAILY"
    });
    const taskSnapshot = await planningService.saveTask({
      title: "Meal prep",
      goalId,
      scheduledFor: completionDate
    });

    await planningService.completeHabit({
      habitId: habitSnapshot.habits[0]!.id,
      completedFor: completionDate
    });
    await planningService.completeTask({ taskId: taskSnapshot.tasks[0]!.id });

    const refreshedWorkspace = await weeklyReviewService.getWorkspace();
    const savedWorkspace = await weeklyReviewService.saveReview({
      weekStart: refreshedWorkspace.insights.weekStart,
      reflection: "Solid week. Meal prep made the weekend easier."
    });

    expect(savedWorkspace.currentReview?.reflection).toBe("Solid week. Meal prep made the weekend easier.");
    expect(savedWorkspace.recentReviews).toHaveLength(1);
    expect(savedWorkspace.currentReview?.summarySnapshot.totalCompletions).toBeGreaterThanOrEqual(1);

    const reloaded = await weeklyReviewService.listReviews();

    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]?.reflection).toBe("Solid week. Meal prep made the weekend easier.");
  });
});
