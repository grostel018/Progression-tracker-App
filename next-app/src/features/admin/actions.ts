"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/app";
import { requestPasswordReset, verifyEmailAddress } from "@/features/auth/service";
import { prisma } from "@/lib/db";
import { getAccessContext } from "@/lib/auth/session";

import { createAdminAuditLog } from "./service";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function requireAdminActor(): Promise<{ actorId: string }> {
  const access = await getAccessContext();

  if (!access.canAccessAdmin || !access.cloudUser?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return { actorId: access.cloudUser.id };
}

async function revalidateAdminPaths(targetUserId: string): Promise<void> {
  revalidatePath(ROUTES.admin);
  revalidatePath(`${ROUTES.admin}/users/${targetUserId}`);
}

export async function suspendUserAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    await prisma.user.update({ where: { id: targetUserId }, data: { status: "SUSPENDED" } });
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "USER_SUSPENDED" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "User suspended." };
  } catch {
    return { status: "error", message: "Could not suspend that user right now." };
  }
}

export async function restoreUserAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    await prisma.user.update({ where: { id: targetUserId }, data: { status: "ACTIVE" } });
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "USER_RESTORED" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "User restored." };
  } catch {
    return { status: "error", message: "Could not restore that user right now." };
  }
}

export async function grantTesterAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    await prisma.user.update({ where: { id: targetUserId }, data: { role: "TESTER" } });
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "TESTER_GRANTED" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "Tester role granted." };
  } catch {
    return { status: "error", message: "Could not grant tester access right now." };
  }
}

export async function revokeTesterAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    await prisma.user.update({ where: { id: targetUserId }, data: { role: "USER" } });
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "TESTER_REVOKED" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "Tester role removed." };
  } catch {
    return { status: "error", message: "Could not revoke tester access right now." };
  }
}

export async function resendVerificationAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });

    if (!user?.email) {
      return { status: "error", message: "This user does not have an email address to verify." };
    }

    await verifyEmailAddress({ email: user.email, token: null, code: null });
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "VERIFICATION_RESENT" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "Verification email prepared." };
  } catch {
    return { status: "error", message: "Could not resend verification right now." };
  }
}

export async function sendPasswordResetAdminAction(targetUserId: string): Promise<AdminActionState> {
  try {
    const { actorId } = await requireAdminActor();
    const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true, passwordHash: true } });

    if (!user?.email || !user.passwordHash) {
      return { status: "error", message: "This user does not have credentials-based sign-in enabled." };
    }

    await requestPasswordReset(user.email);
    await createAdminAuditLog({ actorUserId: actorId, targetUserId, action: "PASSWORD_RESET_SENT" });
    await revalidateAdminPaths(targetUserId);
    return { status: "success", message: "Password reset email prepared." };
  } catch {
    return { status: "error", message: "Could not send a password reset right now." };
  }
}
