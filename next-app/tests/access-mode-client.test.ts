import { afterEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/constants/app";
import { prepareForCloudSignIn, prepareForCloudSignOut } from "@/lib/auth/access-mode-client";

describe("cloud auth transition helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears local mode before cloud sign-in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await prepareForCloudSignIn();

    expect(fetchMock).toHaveBeenCalledWith(
      ROUTES.authAccessMode,
      expect.objectContaining({
        method: "DELETE",
        cache: "no-store"
      })
    );
  });

  it("clears local mode before cloud sign-out", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await prepareForCloudSignOut();

    expect(fetchMock).toHaveBeenCalledWith(
      ROUTES.authAccessMode,
      expect.objectContaining({
        method: "DELETE",
        cache: "no-store"
      })
    );
  });
});
