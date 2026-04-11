import type { OnboardingSnapshot } from "@/features/onboarding/service";
import type { PlanningSnapshot } from "@/types/planning";

export type MinimumSetupCounts = {
  goals: number;
  habits: number;
  tasks: number;
};

export type MinimumSetupState = {
  isComplete: boolean;
  missingGoal: boolean;
  missingAction: boolean;
  counts: MinimumSetupCounts;
};

export function getMinimumSetupStateFromCounts(counts: MinimumSetupCounts): MinimumSetupState {
  const missingGoal = counts.goals < 1;
  const missingAction = counts.habits < 1 && counts.tasks < 1;

  return {
    isComplete: !missingGoal && !missingAction,
    missingGoal,
    missingAction,
    counts
  };
}

export function getMinimumSetupStateFromPlanningSnapshot(snapshot: PlanningSnapshot): MinimumSetupState {
  return getMinimumSetupStateFromCounts({
    goals: snapshot.goals.filter((item) => item.status !== "ARCHIVED").length,
    habits: snapshot.habits.filter((item) => item.status !== "ARCHIVED").length,
    tasks: snapshot.tasks.filter((item) => item.status !== "ARCHIVED").length
  });
}

export function hasCompletedOnboarding(snapshot: Pick<OnboardingSnapshot, "completedAt"> | null | undefined): boolean {
  return Boolean(snapshot?.completedAt);
}

export function getWorkspaceReadinessState(input: {
  onboarding: Pick<OnboardingSnapshot, "completedAt"> | null | undefined;
  counts: MinimumSetupCounts;
}): { onboardingComplete: boolean; minimumSetupComplete: boolean; minimumSetup: MinimumSetupState } {
  const minimumSetup = getMinimumSetupStateFromCounts(input.counts);

  return {
    onboardingComplete: hasCompletedOnboarding(input.onboarding),
    minimumSetupComplete: minimumSetup.isComplete,
    minimumSetup
  };
}
