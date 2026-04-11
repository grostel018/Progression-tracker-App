import { z } from "zod";

import {
  DAILY_COMMITMENT_OPTIONS,
  FOCUS_AREAS,
  MOTIVATION_STYLES,
  ONBOARDING_STEP_IDS,
  PRIMARY_OBSTACLES,
  type OnboardingStepId
} from "@/types/onboarding";

export const onboardingStepEnum = z.enum(ONBOARDING_STEP_IDS);

export const motivationStyleEnum = z.enum(MOTIVATION_STYLES);
export const focusAreaEnum = z.enum(FOCUS_AREAS);
export const dailyCommitmentEnum = z.union([
  z.literal(DAILY_COMMITMENT_OPTIONS[0]),
  z.literal(DAILY_COMMITMENT_OPTIONS[1]),
  z.literal(DAILY_COMMITMENT_OPTIONS[2]),
  z.literal(DAILY_COMMITMENT_OPTIONS[3])
]);
export const primaryObstacleEnum = z.enum(PRIMARY_OBSTACLES);

export const localOnboardingAnswersSchema = z.object({
  id: z.literal("default"),
  version: z.literal(1),
  motivationStyle: motivationStyleEnum.optional(),
  focusArea: focusAreaEnum.optional(),
  dailyCommitmentMinutes: dailyCommitmentEnum.optional(),
  primaryObstacle: primaryObstacleEnum.optional(),
  ninetyDayVision: z.string().trim().min(1).max(240).optional(),
  completedStepIds: z.array(onboardingStepEnum).default([]),
  completedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime()
});

export const cloudOnboardingAnswersSchema = z.object({
  motivationStyle: motivationStyleEnum.optional(),
  focusArea: focusAreaEnum.optional(),
  dailyCommitmentMinutes: dailyCommitmentEnum.optional(),
  primaryObstacle: primaryObstacleEnum.optional(),
  ninetyDayVision: z.string().trim().min(1).max(240).optional(),
  completedStepIds: z.array(onboardingStepEnum).default([]),
  completedAt: z.string().datetime().optional()
});

export const onboardingStepFormSchema = z.discriminatedUnion("stepId", [
  z.object({
    stepId: z.literal("motivation-style"),
    motivationStyle: motivationStyleEnum
  }),
  z.object({
    stepId: z.literal("focus-area"),
    focusArea: focusAreaEnum
  }),
  z.object({
    stepId: z.literal("daily-commitment"),
    dailyCommitmentMinutes: z.coerce.number().pipe(dailyCommitmentEnum)
  }),
  z.object({
    stepId: z.literal("primary-obstacle"),
    primaryObstacle: primaryObstacleEnum
  }),
  z.object({
    stepId: z.literal("ninety-day-vision"),
    ninetyDayVision: z.string().trim().min(12, "Share a little more so the app can guide you well.").max(240)
  })
]);

export type OnboardingStepFormValues = z.infer<typeof onboardingStepFormSchema>;

export const ONBOARDING_STEPS: ReadonlyArray<{
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: "motivation-style",
    eyebrow: "Step 1 of 5",
    title: "What keeps you moving when motivation dips?",
    description: "This helps the product frame encouragement in a way that fits your style instead of sounding generic."
  },
  {
    id: "focus-area",
    eyebrow: "Step 2 of 5",
    title: "Which area deserves the clearest focus first?",
    description: "Your first dashboard state should feel tailored, not like a blank template."
  },
  {
    id: "daily-commitment",
    eyebrow: "Step 3 of 5",
    title: "How much time can you realistically protect each day?",
    description: "The app should respect your real bandwidth, not pressure you into impossible routines."
  },
  {
    id: "primary-obstacle",
    eyebrow: "Step 4 of 5",
    title: "What usually gets in your way?",
    description: "Naming the friction early helps the product respond with the right kind of structure."
  },
  {
    id: "ninety-day-vision",
    eyebrow: "Step 5 of 5",
    title: "If the next 90 days went well, what would be different?",
    description: "A short future-facing answer gives the app a better sense of what progress should point toward."
  }
] as const;

export function getNextOnboardingStep(stepId: OnboardingStepId): OnboardingStepId | null {
  const currentIndex = ONBOARDING_STEPS.findIndex((step) => step.id === stepId);

  if (currentIndex < 0 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null;
  }

  return ONBOARDING_STEPS[currentIndex + 1]?.id ?? null;
}

export function getFirstIncompleteStep(completedStepIds: OnboardingStepId[]): OnboardingStepId {
  const completed = new Set(completedStepIds);
  return ONBOARDING_STEPS.find((step) => !completed.has(step.id))?.id ?? ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].id;
}
