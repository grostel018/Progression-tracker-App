import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type OnboardingPreferenceRecord = Prisma.OnboardingPreferenceGetPayload<Record<string, never>>;

export async function getOnboardingPreferenceByUserId(userId: string): Promise<OnboardingPreferenceRecord | null> {
  return prisma.onboardingPreference.findUnique({
    where: { userId }
  });
}

export async function upsertOnboardingPreference(
  userId: string,
  input: {
    focusArea?: string | null;
    motivationStyle?: string | null;
    dailyCommitmentMinutes?: number | null;
    primaryObstacle?: string | null;
    ninetyDayVision?: string | null;
    completedStepIds?: string[];
    onboardingCompletedAt?: Date | null;
  }
): Promise<OnboardingPreferenceRecord> {
  return prisma.onboardingPreference.upsert({
    where: { userId },
    create: {
      userId,
      focusArea: input.focusArea ?? null,
      motivationStyle: input.motivationStyle ?? null,
      dailyCommitmentMinutes: input.dailyCommitmentMinutes ?? null,
      primaryObstacle: input.primaryObstacle ?? null,
      ninetyDayVision: input.ninetyDayVision ?? null,
      completedStepIds: input.completedStepIds ?? [],
      onboardingCompletedAt: input.onboardingCompletedAt ?? null
    },
    update: {
      focusArea: input.focusArea ?? undefined,
      motivationStyle: input.motivationStyle ?? undefined,
      dailyCommitmentMinutes: input.dailyCommitmentMinutes ?? undefined,
      primaryObstacle: input.primaryObstacle ?? undefined,
      ninetyDayVision: input.ninetyDayVision ?? undefined,
      completedStepIds: input.completedStepIds ?? undefined,
      onboardingCompletedAt: input.onboardingCompletedAt ?? undefined
    }
  });
}
