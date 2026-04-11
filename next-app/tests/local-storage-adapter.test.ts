import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

describe("IndexedDbStorageAdapter", () => {
  it("writes, reads, lists, and removes records", async () => {
    const adapter = new IndexedDbStorageAdapter({
      dbName: `pt-test-${crypto.randomUUID()}`
    });

    expect(await adapter.isAvailable()).toBe(true);

    await adapter.write({
      key: "pt:system:workspace-state",
      value: { hello: "world" },
      updatedAt: "2026-04-03T00:00:00.000Z"
    });

    const record = await adapter.read<{ hello: string }>("pt:system:workspace-state");
    expect(record).toEqual({
      key: "pt:system:workspace-state",
      value: { hello: "world" },
      updatedAt: "2026-04-03T00:00:00.000Z"
    });

    const keys = await adapter.listKeys("pt:");
    expect(keys).toEqual(["pt:system:workspace-state"]);

    await adapter.remove("pt:system:workspace-state");
    expect(await adapter.read("pt:system:workspace-state")).toBeNull();
  });
});
