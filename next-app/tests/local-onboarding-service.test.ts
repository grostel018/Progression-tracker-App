import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createLocalOnboardingService } from "@/features/local-mode/onboarding-storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("local onboarding service", () => {
  it("saves, reloads, and updates onboarding answers without dropping prior fields", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-onboarding-${crypto.randomUUID()}`
    });
    const service = createLocalOnboardingService(adapter);

    const initial = await service.getAnswers();
    expect(initial.completedStepIds).toEqual([]);
    expect(initial.id).toBe("default");

    const afterFirstStep = await service.saveStep("motivation-style", {
      motivationStyle: "mixed"
    });

    expect(afterFirstStep.motivationStyle).toBe("mixed");
    expect(afterFirstStep.completedStepIds).toContain("motivation-style");

    const reloaded = await service.getAnswers();
    expect(reloaded.motivationStyle).toBe("mixed");
    expect(reloaded.completedStepIds).toContain("motivation-style");

    const afterSecondStep = await service.saveStep("focus-area", {
      focusArea: "creativity"
    });

    expect(afterSecondStep.motivationStyle).toBe("mixed");
    expect(afterSecondStep.focusArea).toBe("creativity");
    expect(afterSecondStep.completedStepIds).toEqual(expect.arrayContaining(["motivation-style", "focus-area"]));
  });

  it("fails safely back to defaults when stored data is malformed", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-onboarding-bad-${crypto.randomUUID()}`
    });

    await adapter.write({
      key: "pt:onboarding:answers",
      value: {
        id: "default",
        version: 999,
        completedStepIds: "bad"
      },
      updatedAt: new Date().toISOString()
    });

    const service = createLocalOnboardingService(adapter);
    const result = await service.getAnswers();

    expect(result).toMatchObject({
      id: "default",
      version: 1,
      completedStepIds: []
    });
  });
});
