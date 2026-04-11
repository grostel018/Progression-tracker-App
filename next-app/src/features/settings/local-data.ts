import { createLocalOnboardingService } from "@/features/local-mode/onboarding-storage";
import { createLocalPlanningService } from "@/features/local-mode/planning-storage";
import { createLocalWeeklyReviewService } from "@/features/local-mode/weekly-review-storage";
import { createLocalWorkspaceService } from "@/features/local-mode/storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

import { hasMeaningfulMigrationData, localToCloudMigrationPayloadSchema } from "./schema";
import type { LocalMigrationSnapshot } from "./types";

export async function readLocalMigrationSnapshot(): Promise<LocalMigrationSnapshot> {
  const adapter = new IndexedDbStorageAdapter();
  const workspaceService = createLocalWorkspaceService(adapter);
  const onboardingService = createLocalOnboardingService(adapter);
  const planningService = createLocalPlanningService(adapter);
  const weeklyReviewService = createLocalWeeklyReviewService(adapter);
  const supported = await workspaceService.isAvailable();

  if (!supported) {
    return {
      supported: false,
      hasLocalData: false,
      keyCount: 0,
      payload: localToCloudMigrationPayloadSchema.parse({
        onboarding: null,
        planning: {
          categories: [],
          dreams: [],
          goals: [],
          habits: [],
          tasks: [],
          habitCompletions: [],
          taskCompletions: []
        },
        weeklyReviews: []
      }),
      counts: {
        onboardingSteps: 0,
        categories: 0,
        dreams: 0,
        goals: 0,
        habits: 0,
        tasks: 0,
        weeklyReviews: 0
      }
    };
  }

  const [workspaceSummary, onboarding, planning, weeklyReviews] = await Promise.all([
    workspaceService.getSummary(),
    onboardingService.getAnswers(),
    planningService.getSnapshot(),
    weeklyReviewService.listReviews()
  ]);
  const payload = localToCloudMigrationPayloadSchema.parse({
    onboarding,
    planning,
    weeklyReviews
  });

  return {
    supported: true,
    hasLocalData: hasMeaningfulMigrationData(payload),
    keyCount: workspaceSummary.keyCount,
    payload,
    counts: {
      onboardingSteps: onboarding.completedStepIds.length,
      categories: planning.categories.length,
      dreams: planning.dreams.length,
      goals: planning.goals.length,
      habits: planning.habits.length,
      tasks: planning.tasks.length,
      weeklyReviews: weeklyReviews.length
    }
  };
}
