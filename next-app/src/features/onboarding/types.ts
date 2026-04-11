import type { OnboardingStepId } from "@/types/onboarding";

import type { OnboardingSnapshot } from "./service";

export type OnboardingActionStatus = "idle" | "success" | "error";

export type OnboardingActionState = {
  status: OnboardingActionStatus;
  message?: string;
  fieldErrors?: Record<string, string>;
  answers: OnboardingSnapshot;
  currentStep: OnboardingStepId;
  nextStep?: OnboardingStepId | null;
  completed?: boolean;
};

export const ONBOARDING_ACTION_INITIAL_STATE: OnboardingActionState = {
  status: "idle",
  answers: {
    completedStepIds: []
  },
  currentStep: "motivation-style"
};
