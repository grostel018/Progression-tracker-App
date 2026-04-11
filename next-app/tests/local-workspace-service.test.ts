import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createLocalWorkspaceService } from "@/features/local-mode/storage";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("local workspace service", () => {
  it("creates and refreshes a local workspace record for protected surfaces", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-workspace-${crypto.randomUUID()}`
    });
    const service = createLocalWorkspaceService(adapter);

    const firstSummary = await service.touchSurface("dashboard");

    expect(firstSummary.isAvailable).toBe(true);
    expect(firstSummary.keyCount).toBe(1);
    expect(firstSummary.state?.version).toBe(1);
    expect(firstSummary.state?.surfaces.dashboard).toBeTruthy();
    expect(firstSummary.state?.entityNamespaces).toContain("goals");

    const secondSummary = await service.touchSurface("onboarding");

    expect(secondSummary.keyCount).toBe(1);
    expect(secondSummary.state?.initializedAt).toBe(firstSummary.state?.initializedAt);
    expect(secondSummary.state?.surfaces.dashboard).toBeTruthy();
    expect(secondSummary.state?.surfaces.onboarding).toBeTruthy();

    const summary = await service.getSummary();
    expect(summary.isAvailable).toBe(true);
    expect(summary.keyCount).toBe(1);
  });
});
