import { describe, expect, it } from "vitest";

import { validateAvatarFile } from "@/lib/storage/server/media";

describe("avatar validation", () => {
  it("accepts a png avatar with a valid signature", async () => {
    const pngBytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);
    const file = new File([pngBytes], "avatar.png", { type: "image/png" });

    const result = await validateAvatarFile(file);

    expect(result.contentType).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(result.buffer.byteLength).toBe(pngBytes.byteLength);
  });

  it("rejects avatars larger than 2 MB", async () => {
    const largeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "avatar.png", { type: "image/png" });

    await expect(validateAvatarFile(largeFile)).rejects.toThrow("AVATAR_TOO_LARGE");
  });
});
