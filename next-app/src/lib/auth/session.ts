import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

import { ACCESS_MODE_COOKIE, ACCESS_MODES, type AccessMode } from "./cookies";
import type { UserRole } from "./roles";
import { authOptions } from "./options";

export type SessionUser = {
  id: string;
  email: string;
  username?: string | null;
  role: UserRole;
};

export type CloudSession = {
  kind: "cloud";
  user: SessionUser;
  expiresAt: string;
};

export type LocalSession = {
  kind: "local";
  mode: AccessMode;
};

export type AppSession = CloudSession | LocalSession | null;

export type AccessContext = {
  mode: AccessMode | null;
  hasLocalAccess: boolean;
  hasCloudSession: boolean;
  canAccessProtectedApp: boolean;
  canAccessAdmin: boolean;
  cloudUser: SessionUser | null;
};

async function resolveActiveCloudUser(input: {
  id?: string | null;
  email?: string | null;
}): Promise<SessionUser | null> {
  const userId = input.id?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!userId && !email) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true
    }
  });

  if (!user || !user.email || user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username ?? null,
    role: user.role
  };
}

export async function getSession(): Promise<AppSession> {
  try {
    const cloudSession = await getServerSession(authOptions);
    const cloudUser = await resolveActiveCloudUser({
      id: cloudSession?.user?.id,
      email: cloudSession?.user?.email
    });

    if (cloudSession?.user?.email && cloudUser) {
      return {
        kind: "cloud",
        user: cloudUser,
        expiresAt: cloudSession.expires
      };
    }
  } catch {
    // Build-time rendering and other non-request contexts should gracefully behave as signed out.
  }

  try {
    const accessMode = cookies().get(ACCESS_MODE_COOKIE)?.value;

    if (accessMode === ACCESS_MODES.LOCAL) {
      return {
        kind: "local",
        mode: ACCESS_MODES.LOCAL
      };
    }
  } catch {
    // No request cookies available in this context.
  }

  return null;
}

export async function getAccessContext(): Promise<AccessContext> {
  const session = await getSession();

  return {
    mode: session?.kind === "local" ? session.mode : session?.kind === "cloud" ? ACCESS_MODES.CLOUD : null,
    hasLocalAccess: session?.kind === "local",
    hasCloudSession: session?.kind === "cloud",
    canAccessProtectedApp: session?.kind === "local" || session?.kind === "cloud",
    canAccessAdmin: session?.kind === "cloud" && session.user.role === "ADMIN",
    cloudUser: session?.kind === "cloud" ? session.user : null
  };
}
