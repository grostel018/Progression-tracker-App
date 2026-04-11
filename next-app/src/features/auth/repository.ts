import type { Prisma, User } from "@prisma/client";

import { USER_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: {
    profile: true;
    onboardingPreference: true;
    accounts: true;
  };
}>;

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    },
    include: {
      profile: true,
      onboardingPreference: true,
      accounts: true
    }
  });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: {
      username
    }
  });
}

export async function createCredentialUser(input: { email: string; username?: string | null; passwordHash: string }): Promise<User> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedUsername = input.username?.trim() || null;

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizedUsername,
      name: normalizedUsername ?? normalizedEmail.split("@")[0],
      passwordHash: input.passwordHash,
      profile: {
        create: {
          displayName: normalizedUsername ?? normalizedEmail.split("@")[0]
        }
      },
      onboardingPreference: {
        create: {}
      }
    }
  });
}

export async function ensureUserScaffolding(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return;
  }

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: user.username ?? user.name ?? user.email ?? "Progression user"
    },
    update: {}
  });

  await prisma.onboardingPreference.upsert({
    where: { userId },
    create: {
      userId
    },
    update: {}
  });
}

export async function syncGoogleUserByEmail(input: { email: string; name?: string | null; image?: string | null }): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();

  await prisma.user.updateMany({
    where: { email: normalizedEmail },
    data: {
      emailVerified: new Date(),
      status: "ACTIVE",
      role: USER_ROLES.USER,
      name: input.name ?? undefined,
      image: input.image ?? undefined
    }
  });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (user) {
    await ensureUserScaffolding(user.id);
  }
}

export async function markUserEmailVerified(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date()
    }
  });
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash
    }
  });
}

