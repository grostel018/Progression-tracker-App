import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { fromThemeEnumValue, resolveAppliedTheme, toThemeEnumValue, type ThemePreference } from "@/lib/theme";
import { removeAvatarAsset, storeAvatarAsset } from "@/lib/storage/server/media";
import { getMinimumSetupStateFromCounts } from "@/features/workspace/state";
import { getReminderPreferencesForUser, saveReminderPreferences } from "@/features/reminders/service";
import { isOnboardingStepId, type OnboardingStepId } from "@/types/onboarding";
import type { ReminderPreferenceSnapshot } from "@/features/reminders/schema";

import { hasMeaningfulMigrationData, localToCloudMigrationPayloadSchema, settingsProfileSchema, type LocalToCloudMigrationPayload, type ReminderPreferenceValues, type SettingsProfileValues } from "./schema";
import type { CloudSettingsWorkspace, ProfileSettingsSnapshot, ThemeSettingsSnapshot } from "./types";

const CLOUD_WORKSPACE_NOT_EMPTY = "CLOUD_WORKSPACE_NOT_EMPTY";
const LOCAL_MIGRATION_EMPTY = "LOCAL_MIGRATION_EMPTY";

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toDateTime(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toCalendarDateTime(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeCompletedStepIds(value: Prisma.JsonValue | null | undefined): OnboardingStepId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (typeof item === "string" && isOnboardingStepId(item) ? [item] : []));
}

function hasCompletedOnboardingData(record: {
  focusArea: string | null;
  motivationStyle: string | null;
  dailyCommitmentMinutes: number | null;
  primaryObstacle: string | null;
  ninetyDayVision: string | null;
  completedStepIds: Prisma.JsonValue | null;
  onboardingCompletedAt: Date | null;
} | null): boolean {
  if (!record) {
    return false;
  }

  return Boolean(
    record.focusArea
    || record.motivationStyle
    || record.dailyCommitmentMinutes
    || record.primaryObstacle
    || record.ninetyDayVision
    || record.onboardingCompletedAt
    || normalizeCompletedStepIds(record.completedStepIds).length > 0
  );
}

function buildProviders(input: { accountProviders: string[]; hasPasswordAuth: boolean }): string[] {
  const providers = new Set(input.accountProviders.map((provider) => provider.toLowerCase()));

  if (input.hasPasswordAuth) {
    providers.add("credentials");
  }

  return Array.from(providers).sort();
}

function toImportedCounts(payload: LocalToCloudMigrationPayload) {
  return {
    categories: payload.planning.categories.length,
    dreams: payload.planning.dreams.length,
    goals: payload.planning.goals.length,
    habits: payload.planning.habits.length,
    tasks: payload.planning.tasks.length,
    weeklyReviews: payload.weeklyReviews.length
  };
}

function buildThemeSnapshot(preference: ThemePreference): ThemeSettingsSnapshot {
  return {
    preference,
    appliedTheme: resolveAppliedTheme(preference, true)
  };
}

async function getWorkspaceCounts(userId: string): Promise<CloudSettingsWorkspace["workspace"]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      onboardingPreference: true
    }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const [categories, dreams, goals, habits, tasks, weeklyReviews] = await prisma.$transaction([
    prisma.category.count({ where: { userId } }),
    prisma.dream.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.habit.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
    prisma.weeklyReview.count({ where: { userId } })
  ]);
  const hasOnboardingData = hasCompletedOnboardingData(user.onboardingPreference);
  const minimumSetup = getMinimumSetupStateFromCounts({ goals, habits, tasks });

  return {
    isEmpty: categories === 0 && dreams === 0 && goals === 0 && habits === 0 && tasks === 0 && weeklyReviews === 0 && !hasOnboardingData,
    hasCompletedOnboarding: Boolean(user.onboardingPreference?.onboardingCompletedAt),
    minimumSetupComplete: minimumSetup.isComplete,
    counts: {
      categories,
      dreams,
      goals,
      habits,
      tasks,
      weeklyReviews
    }
  };
}

export async function getCloudSettingsWorkspace(userId: string): Promise<CloudSettingsWorkspace> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      accounts: {
        select: {
          provider: true
        }
      },
      reminderPreference: true
    }
  });

  if (!user || !user.email) {
    throw new Error("USER_NOT_FOUND");
  }

  const [workspace, reminders] = await Promise.all([
    getWorkspaceCounts(userId),
    getReminderPreferencesForUser(userId)
  ]);
  const themePreference = fromThemeEnumValue(user.profile?.uiThemePreference ?? "SYSTEM");

  return {
    account: {
      email: user.email,
      username: user.username ?? null,
      providers: buildProviders({
        accountProviders: user.accounts.map((account) => account.provider),
        hasPasswordAuth: Boolean(user.passwordHash)
      }),
      hasPasswordAuth: Boolean(user.passwordHash),
      emailVerifiedAt: toIsoString(user.emailVerified)
    },
    profile: {
      displayName: user.profile?.displayName ?? user.name ?? user.username ?? user.email.split("@")[0],
      bio: user.profile?.bio ?? "",
      avatarUrl: user.profile?.avatarUrl ?? null
    },
    theme: buildThemeSnapshot(themePreference),
    reminders,
    workspace
  };
}

export async function updateCloudSettingsProfile(userId: string, input: SettingsProfileValues): Promise<ProfileSettingsSnapshot> {
  const values = settingsProfileSchema.parse(input);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: values.displayName
    }
  });

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: values.displayName,
      bio: values.bio ?? null
    },
    update: {
      displayName: values.displayName,
      bio: values.bio ?? null
    }
  });

  return {
    displayName: profile.displayName ?? values.displayName,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? null
  };
}

export async function saveThemePreferenceForUser(userId: string | null, preference: ThemePreference): Promise<ThemeSettingsSnapshot> {
  if (userId) {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        uiThemePreference: toThemeEnumValue(preference)
      },
      update: {
        uiThemePreference: toThemeEnumValue(preference)
      }
    });
  }

  return buildThemeSnapshot(preference);
}

export async function saveAvatarForUser(userId: string, file: File): Promise<ProfileSettingsSnapshot> {
  const existing = await prisma.profile.findUnique({
    where: { userId },
    select: {
      avatarStorageKey: true,
      displayName: true,
      bio: true
    }
  });
  const uploaded = await storeAvatarAsset(userId, file);

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        avatarUrl: uploaded.url,
        avatarStorageKey: uploaded.key,
        displayName: existing?.displayName ?? undefined,
        bio: existing?.bio ?? undefined
      },
      update: {
        avatarUrl: uploaded.url,
        avatarStorageKey: uploaded.key
      }
    });

    await removeAvatarAsset(existing?.avatarStorageKey);

    return {
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl ?? null
    };
  } catch (error) {
    await removeAvatarAsset(uploaded.key);
    throw error;
  }
}

export async function removeAvatarForUser(userId: string): Promise<ProfileSettingsSnapshot> {
  const existing = await prisma.profile.findUnique({
    where: { userId }
  });

  if (!existing) {
    return {
      displayName: "",
      bio: "",
      avatarUrl: null
    };
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      avatarUrl: null,
      avatarStorageKey: null
    }
  });
  await removeAvatarAsset(existing.avatarStorageKey);

  return {
    displayName: existing.displayName ?? "",
    bio: existing.bio ?? "",
    avatarUrl: null
  };
}

export async function saveCloudReminderPreferences(userId: string, input: ReminderPreferenceValues): Promise<ReminderPreferenceSnapshot> {
  return saveReminderPreferences(userId, input);
}

export async function importLocalWorkspaceToCloud(userId: string, input: LocalToCloudMigrationPayload) {
  const payload = localToCloudMigrationPayloadSchema.parse(input);

  if (!hasMeaningfulMigrationData(payload)) {
    throw new Error(LOCAL_MIGRATION_EMPTY);
  }

  const workspace = await getWorkspaceCounts(userId);

  if (!workspace.isEmpty) {
    throw new Error(CLOUD_WORKSPACE_NOT_EMPTY);
  }

  await prisma.$transaction(async (tx) => {
    const categoryIdMap = new Map<string, string>();
    const dreamIdMap = new Map<string, string>();
    const goalIdMap = new Map<string, string>();
    const habitIdMap = new Map<string, string>();
    const taskIdMap = new Map<string, string>();

    if (payload.onboarding) {
      await tx.onboardingPreference.upsert({
        where: { userId },
        create: {
          userId,
          focusArea: payload.onboarding.focusArea ?? null,
          motivationStyle: payload.onboarding.motivationStyle ?? null,
          dailyCommitmentMinutes: payload.onboarding.dailyCommitmentMinutes ?? null,
          primaryObstacle: payload.onboarding.primaryObstacle ?? null,
          ninetyDayVision: payload.onboarding.ninetyDayVision ?? null,
          completedStepIds: payload.onboarding.completedStepIds,
          onboardingCompletedAt: toDateTime(payload.onboarding.completedAt)
        },
        update: {
          focusArea: payload.onboarding.focusArea ?? null,
          motivationStyle: payload.onboarding.motivationStyle ?? null,
          dailyCommitmentMinutes: payload.onboarding.dailyCommitmentMinutes ?? null,
          primaryObstacle: payload.onboarding.primaryObstacle ?? null,
          ninetyDayVision: payload.onboarding.ninetyDayVision ?? null,
          completedStepIds: payload.onboarding.completedStepIds,
          onboardingCompletedAt: toDateTime(payload.onboarding.completedAt)
        }
      });
    }

    for (const category of payload.planning.categories) {
      const created = await tx.category.create({
        data: {
          userId,
          name: category.name,
          description: category.description ?? null,
          status: category.status
        }
      });

      categoryIdMap.set(category.id, created.id);
    }

    for (const dream of payload.planning.dreams) {
      const created = await tx.dream.create({
        data: {
          userId,
          categoryId: dream.categoryId ? categoryIdMap.get(dream.categoryId) ?? null : null,
          title: dream.title,
          description: dream.description ?? null,
          vision: dream.vision ?? null,
          status: dream.status,
          targetDate: toDateTime(dream.targetDate)
        }
      });

      dreamIdMap.set(dream.id, created.id);
    }

    for (const goal of payload.planning.goals) {
      const created = await tx.goal.create({
        data: {
          userId,
          categoryId: goal.categoryId ? categoryIdMap.get(goal.categoryId) ?? null : null,
          dreamId: goal.dreamId ? dreamIdMap.get(goal.dreamId) ?? null : null,
          title: goal.title,
          description: goal.description ?? null,
          status: goal.status,
          progressType: goal.progressType,
          targetDate: toDateTime(goal.targetDate),
          targetValue: goal.targetValue ?? null,
          currentValue: goal.currentValue
        }
      });

      goalIdMap.set(goal.id, created.id);
    }

    for (const habit of payload.planning.habits) {
      const created = await tx.habit.create({
        data: {
          userId,
          goalId: habit.goalId ? goalIdMap.get(habit.goalId) ?? null : null,
          title: habit.title,
          description: habit.description ?? null,
          status: habit.status,
          frequency: habit.frequency,
          customDays: habit.customDays ? habit.customDays : Prisma.JsonNull
        }
      });

      habitIdMap.set(habit.id, created.id);
    }

    for (const task of payload.planning.tasks) {
      const created = await tx.task.create({
        data: {
          userId,
          goalId: task.goalId ? goalIdMap.get(task.goalId) ?? null : null,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          scheduledFor: toDateTime(task.scheduledFor),
          completedAt: toDateTime(task.completedAt)
        }
      });

      taskIdMap.set(task.id, created.id);
    }

    for (const completion of payload.planning.habitCompletions) {
      const mappedHabitId = habitIdMap.get(completion.habitId);

      if (!mappedHabitId) {
        continue;
      }

      await tx.habitCompletion.create({
        data: {
          habitId: mappedHabitId,
          completedFor: completion.completedFor,
          completedAt: new Date(completion.completedAt),
          createdAt: new Date(completion.createdAt)
        }
      });
    }

    for (const completion of payload.planning.taskCompletions) {
      const mappedTaskId = taskIdMap.get(completion.taskId);

      if (!mappedTaskId) {
        continue;
      }

      await tx.taskCompletion.create({
        data: {
          taskId: mappedTaskId,
          completedAt: new Date(completion.completedAt),
          createdAt: new Date(completion.createdAt)
        }
      });
    }

    for (const review of payload.weeklyReviews) {
      await tx.weeklyReview.create({
        data: {
          userId,
          reviewWeekStart: toCalendarDateTime(review.weekStart),
          reviewWeekEnd: toCalendarDateTime(review.weekEnd),
          summarySnapshot: review.summarySnapshot as Prisma.InputJsonValue,
          reflection: review.reflection ?? null,
          completedAt: new Date(review.completedAt)
        }
      });
    }
  });

  return {
    importedCounts: toImportedCounts(payload)
  };
}

export { CLOUD_WORKSPACE_NOT_EMPTY, LOCAL_MIGRATION_EMPTY };


