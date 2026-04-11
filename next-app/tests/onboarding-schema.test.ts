import { describe, expect, it } from "vitest";

import { onboardingStepFormSchema } from "@/features/onboarding/schema";

describe("onboarding schema", () => {
  it("accepts a valid focus-area step", () => {
    const result = onboardingStepFormSchema.safeParse({
      stepId: "focus-area",
      focusArea: "creativity"
    });

    expect(result.success).toBe(true);
  });

  it("rejects a daily-commitment step with an unsupported value", () => {
    const result = onboardingStepFormSchema.safeParse({
      stepId: "daily-commitment",
      dailyCommitmentMinutes: 90
    });

    expect(result.success).toBe(false);
  });

  it("rejects a ninety-day vision that is too short", () => {
    const result = onboardingStepFormSchema.safeParse({
      stepId: "ninety-day-vision",
      ninetyDayVision: "too short"
    });

    expect(result.success).toBe(false);
  });
});
