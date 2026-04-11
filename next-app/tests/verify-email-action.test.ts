import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, headersMock, verifyEmailAddressMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  verifyEmailAddressMock: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/features/auth/service", () => ({
  requestPasswordReset: vi.fn(),
  resetPasswordWithToken: vi.fn(),
  registerCredentialUser: vi.fn(),
  verifyEmailAddress: verifyEmailAddressMock
}));

import { submitVerifyEmail } from "@/features/auth/actions/public-access";
import { AUTH_ACTION_INITIAL_STATE } from "@/features/auth/types";
import { resetRateLimitStore } from "@/lib/security/rate-limit";

describe("verify email action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    cookiesMock.mockReturnValue({
      set: vi.fn(),
      delete: vi.fn()
    });
    headersMock.mockReturnValue(
      new Headers({
        "x-forwarded-for": "127.0.0.1"
      })
    );
    verifyEmailAddressMock.mockRejectedValue(new Error("INVALID_VERIFICATION_TOKEN"));
  });

  it("returns a friendly rate-limit message after repeated verification failures", async () => {
    for (let index = 0; index < 8; index += 1) {
      const formData = new FormData();
      formData.set("email", "person@example.com");
      formData.set("code", "123456");

      const result = await submitVerifyEmail(AUTH_ACTION_INITIAL_STATE, formData);

      expect(result.message).toBe("That verification link or code is invalid. Request a fresh verification email and try again.");
    }

    const blockedFormData = new FormData();
    blockedFormData.set("email", "person@example.com");
    blockedFormData.set("code", "123456");

    const blocked = await submitVerifyEmail(AUTH_ACTION_INITIAL_STATE, blockedFormData);

    expect(blocked.status).toBe("error");
    expect(blocked.message).toContain("Too many verification attempts");
    expect(verifyEmailAddressMock).toHaveBeenCalledTimes(8);
  });
});
