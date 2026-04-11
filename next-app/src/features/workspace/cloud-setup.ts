import { getCloudOnboardingState, isOnboardingComplete } from "@/features/onboarding/service";
import { getCloudPlanningSnapshot } from "@/features/planning/service";

import { getMinimumSetupStateFromPlanningSnapshot } from "./state";

export async function getCloudSetupGate(userId: string): Promise<{
  onboardingComplete: boolean;
  minimumSetupComplete: boolean;
}> {
  const onboarding = await getCloudOnboardingState(userId);

  if (!isOnboardingComplete(onboarding)) {
    return {
      onboardingComplete: false,
      minimumSetupComplete: false
    };
  }

  const planningSnapshot = await getCloudPlanningSnapshot(userId);
  const minimumSetup = getMinimumSetupStateFromPlanningSnapshot(planningSnapshot);

  return {
    onboardingComplete: true,
    minimumSetupComplete: minimumSetup.isComplete
  };
}
