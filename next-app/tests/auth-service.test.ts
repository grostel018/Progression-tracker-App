import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(() => ({
    APP_URL: "http://localhost:3000"
  }))
}));

vi.mock("@/lib/auth/email", () => ({
  buildResetMessage: vi.fn((_email: string, token: string, _appUrl: string, mode: "reset-password" | "create-password" = "reset-password") => ({
    to: "person@example.com",
    subject: mode,
    text: token,
    html: token
  })),
  buildVerificationMessage: vi.fn((_email: string, token: string) => ({
    to: "person@example.com",
    subject: "verify",
    text: token,
    html: token
  })),
  sendMail: vi.fn(async () => ({
    mode: "preview" as const,
    previewPath: ".tmp/outbox/test-message.json"
  }))
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async () => "hashed-password")
}));

vi.mock("@/lib/auth/tokens", () => ({
  AUTH_TOKEN_PURPOSES: {
    VERIFY_EMAIL: "verify-email",
    RESET_PASSWORD: "reset-password"
  },
  clearAuthTokens: vi.fn(async () => undefined),
  consumeAuthToken: vi.fn(async () => true),
  issueAuthToken: vi.fn(async () => ({
    rawToken: "718393",
    expiresAt: new Date("2026-01-01T00:00:00.000Z")
  }))
}));

vi.mock("@/features/auth/repository", () => ({
  createCredentialUser: vi.fn(),
  ensureUserScaffolding: vi.fn(async () => undefined),
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  markUserEmailVerified: vi.fn(async () => undefined),
  updateUserPassword: vi.fn(async () => undefined)
}));

import { requestPasswordReset, verifyEmailAddress } from "@/features/auth/service";
import { clearAuthTokens, consumeAuthToken, issueAuthToken } from "@/lib/auth/tokens";
import { buildResetMessage, buildVerificationMessage, sendMail } from "@/lib/auth/email";
import { findUserByEmail, markUserEmailVerified } from "@/features/auth/repository";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a create-password recovery mode for Google-only accounts", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      passwordHash: null,
      accounts: [{ provider: "google" }]
    } as never);

    const result = await requestPasswordReset("person@example.com");

    expect(result?.recoveryMode).toBe("create-password");
    expect(issueAuthToken).toHaveBeenCalledWith("reset-password", "person@example.com", 30);
    expect(buildResetMessage).toHaveBeenCalledWith("person@example.com", "718393", "http://localhost:3000", "create-password");
    expect(sendMail).toHaveBeenCalled();
  });

  it("returns a normal reset mode for password accounts", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      passwordHash: "hashed-password",
      accounts: []
    } as never);

    const result = await requestPasswordReset("person@example.com");

    expect(result?.recoveryMode).toBe("reset-password");
    expect(buildResetMessage).toHaveBeenCalledWith("person@example.com", "718393", "http://localhost:3000", "reset-password");
  });

  it("does not issue recovery data for an unknown email", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const result = await requestPasswordReset("missing@example.com");

    expect(result).toBeNull();
    expect(issueAuthToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("normalizes malformed verification tokens before consuming them", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      emailVerified: null
    } as never);

    await verifyEmailAddress({
      email: "person@example.com",
      token: "718393\n\nIf you prefer to enter a code manually",
      code: null
    });

    expect(consumeAuthToken).toHaveBeenCalledWith("verify-email", "person@example.com", "718393");
    expect(markUserEmailVerified).toHaveBeenCalledWith("user-1");
    expect(clearAuthTokens).toHaveBeenCalledWith("verify-email", "person@example.com");
  });

  it("sends a fresh verification email when no token or code is provided", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      emailVerified: null
    } as never);

    const result = await verifyEmailAddress({
      email: "person@example.com",
      token: null,
      code: null
    });

    expect(issueAuthToken).toHaveBeenCalledWith("verify-email", "person@example.com", 60);
    expect(buildVerificationMessage).toHaveBeenCalledWith("person@example.com", "718393", "http://localhost:3000");
    expect(sendMail).toHaveBeenCalled();
    expect(result).toEqual({
      delivery: {
        mode: "preview",
        previewPath: ".tmp/outbox/test-message.json"
      }
    });
  });

  it("returns alreadyVerified when the account is already verified", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      emailVerified: new Date("2026-01-01T00:00:00.000Z")
    } as never);

    const result = await verifyEmailAddress({
      email: "person@example.com",
      token: null,
      code: null
    });

    expect(result).toEqual({ alreadyVerified: true });
    expect(issueAuthToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
