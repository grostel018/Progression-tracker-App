import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, getServerSessionMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getServerSessionMock: vi.fn()
}));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findFirst: vi.fn()
    }
  }
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("@/lib/auth/options", () => ({
  authOptions: {}
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock
}));

import { ACCESS_MODE_COOKIE, ACCESS_MODES } from "@/lib/auth/cookies";
import { getSession } from "@/lib/auth/session";

describe("session resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findFirst.mockResolvedValue(null);
    cookiesMock.mockReturnValue({
      get: vi.fn(() => undefined)
    });
  });

  it("prefers a cloud session over a stale local mode cookie", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "person@example.com",
        role: "USER",
        username: "person"
      },
      expires: "2026-04-10T00:00:00.000Z"
    });
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      username: "person",
      role: "USER",
      status: "ACTIVE"
    });
    cookiesMock.mockReturnValue({
      get: vi.fn((name: string) => (name === ACCESS_MODE_COOKIE ? { value: ACCESS_MODES.LOCAL } : undefined))
    });

    const session = await getSession();

    expect(session).toEqual({
      kind: "cloud",
      user: {
        id: "user-1",
        email: "person@example.com",
        role: "USER",
        username: "person"
      },
      expiresAt: "2026-04-10T00:00:00.000Z"
    });
  });

  it("treats a stale cloud session as signed out when the user record no longer exists", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "person@example.com",
        role: "USER",
        username: "person"
      },
      expires: "2026-04-10T00:00:00.000Z"
    });

    const session = await getSession();

    expect(session).toBeNull();
  });
});
