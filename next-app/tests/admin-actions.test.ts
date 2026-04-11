import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prismaMock: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn()
    }
  },
  getAccessContextMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  verifyEmailAddressMock: vi.fn(),
  requestPasswordResetMock: vi.fn(),
  createAdminAuditLogMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prismaMock
}));

vi.mock("@/lib/auth/session", () => ({
  getAccessContext: mocks.getAccessContextMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePathMock
}));

vi.mock("@/features/auth/service", () => ({
  requestPasswordReset: mocks.requestPasswordResetMock,
  verifyEmailAddress: mocks.verifyEmailAddressMock
}));

vi.mock("@/features/admin/service", () => ({
  createAdminAuditLog: mocks.createAdminAuditLogMock
}));

import { grantTesterAction, sendPasswordResetAdminAction, suspendUserAction } from "@/features/admin/actions";

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects support actions when the actor is not an admin", async () => {
    mocks.getAccessContextMock.mockResolvedValue({ canAccessAdmin: false, cloudUser: null });

    const result = await suspendUserAction("user-1");

    expect(result.status).toBe("error");
    expect(mocks.prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("grants tester access and writes an audit entry", async () => {
    mocks.getAccessContextMock.mockResolvedValue({ canAccessAdmin: true, cloudUser: { id: "admin-1" } });
    mocks.prismaMock.user.update.mockResolvedValue(undefined);

    const result = await grantTesterAction("user-1");

    expect(result).toEqual({ status: "success", message: "Tester role granted." });
    expect(mocks.prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: "TESTER" }
    });
    expect(mocks.createAdminAuditLogMock).toHaveBeenCalledWith({
      actorUserId: "admin-1",
      targetUserId: "user-1",
      action: "TESTER_GRANTED"
    });
    expect(mocks.revalidatePathMock).toHaveBeenCalled();
  });

  it("blocks password reset support when the target user has no credentials password", async () => {
    mocks.getAccessContextMock.mockResolvedValue({ canAccessAdmin: true, cloudUser: { id: "admin-1" } });
    mocks.prismaMock.user.findUnique.mockResolvedValue({ email: "person@example.com", passwordHash: null });

    const result = await sendPasswordResetAdminAction("user-1");

    expect(result.status).toBe("error");
    expect(mocks.requestPasswordResetMock).not.toHaveBeenCalled();
  });
});
