import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/onboarding/repository", () => ({
  getOnboardingPreferenceByUserId: vi.fn(),
  upsertOnboardingPreference: vi.fn()
}));

import { getOnboardingPreferenceByUserId, upsertOnboardingPreference } from "@/features/onboarding/repository";
import { getCloudOnboardingState, saveCloudOnboardingStep } from "@/features/onboarding/service";

describe("onboarding service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps persisted onboarding state into the shared answer shape", async () => {
    vi.mocked(getOnboardingPreferenceByUserId).mockResolvedValue({
      focusArea: "health",
      motivationStyle: "intrinsic",
      dailyCommitmentMinutes: 15,
      primaryObstacle: "consistency",
      ninetyDayVision: "Build a rhythm that feels automatic.",
      completedStepIds: ["motivation-style", "focus-area"],
      onboardingCompletedAt: null
    } as never);

    const result = await getCloudOnboardingState("user-1");

    expect(result).toEqual({
      focusArea: "health",
      motivationStyle: "intrinsic",
      dailyCommitmentMinutes: 15,
      primaryObstacle: "consistency",
      ninetyDayVision: "Build a rhythm that feels automatic.",
      completedStepIds: ["motivation-style", "focus-area"],
      completedAt: undefined
    });
  });

  it("saves a final onboarding step and marks completion", async () => {
    vi.mocked(getOnboardingPreferenceByUserId).mockResolvedValue({
      focusArea: "creativity",
      motivationStyle: "mixed",
      dailyCommitmentMinutes: 30,
      primaryObstacle: "overwhelm",
      ninetyDayVision: null,
      completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle"],
      onboardingCompletedAt: null
    } as never);

    vi.mocked(upsertOnboardingPreference).mockResolvedValue({
      focusArea: "creativity",
      motivationStyle: "mixed",
      dailyCommitmentMinutes: 30,
      primaryObstacle: "overwhelm",
      ninetyDayVision: "I want a calmer creative routine with less friction.",
      completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"],
      onboardingCompletedAt: new Date("2026-04-03T00:00:00.000Z")
    } as never);

    const result = await saveCloudOnboardingStep("user-1", {
      stepId: "ninety-day-vision",
      ninetyDayVision: "I want a calmer creative routine with less friction."
    });

    expect(upsertOnboardingPreference).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        ninetyDayVision: "I want a calmer creative routine with less friction.",
        completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"]
      })
    );
    expect(result.completed).toBe(true);
    expect(result.nextStep).toBeNull();
    expect(result.answers.completedAt).toBe("2026-04-03T00:00:00.000Z");
  });
});
