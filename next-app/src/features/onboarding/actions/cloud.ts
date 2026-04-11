"use server";

import { ZodError } from "zod";

import { getSession } from "@/lib/auth/session";

import { getFirstIncompleteStep, onboardingStepFormSchema } from "../schema";
import { saveCloudOnboardingStep } from "../service";
import type { OnboardingActionState } from "../types";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export async function submitCloudOnboardingStep(previousState: OnboardingActionState, formData: FormData): Promise<OnboardingActionState> {
  const session = await getSession();

  if (!session || session.kind !== "cloud") {
    return {
      ...previousState,
      status: "error",
      message: "Cloud onboarding needs an authenticated cloud session."
    };
  }

  try {
    const values = onboardingStepFormSchema.parse({
      stepId: formData.get("stepId"),
      motivationStyle: formData.get("motivationStyle"),
      focusArea: formData.get("focusArea"),
      dailyCommitmentMinutes: formData.get("dailyCommitmentMinutes"),
      primaryObstacle: formData.get("primaryObstacle"),
      ninetyDayVision: formData.get("ninetyDayVision")
    });

    const result = await saveCloudOnboardingStep(session.user.id, values);

    return {
      status: "success",
      message: result.completed ? "Onboarding is complete. The dashboard is ready for your first real setup state." : "Progress saved. Keep the setup flow moving.",
      answers: result.answers,
      currentStep: result.nextStep ?? values.stepId,
      nextStep: result.nextStep,
      completed: result.completed
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const currentStep = typeof formData.get("stepId") === "string" ? (formData.get("stepId") as OnboardingActionState["currentStep"]) : previousState.currentStep;

      return {
        ...previousState,
        status: "error",
        message: "Choose an answer for this step before continuing.",
        fieldErrors: flattenFieldErrors(error),
        currentStep,
        nextStep: getFirstIncompleteStep(previousState.answers.completedStepIds)
      };
    }

    return {
      ...previousState,
      status: "error",
      message: "We could not save this onboarding step right now."
    };
  }
}
