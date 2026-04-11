import { Prisma } from "@prisma/client";

import { getMinimumSetupStateFromCounts } from "@/features/workspace/state";
import { prisma } from "@/lib/db";

export type AdminDashboardFilters = {
  query?: string;
  status?: "ACTIVE" | "SUSPENDED" | "DELETED" | "ALL";
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  role: "USER" | "TESTER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
  emailVerifiedAt: string | null;
  onboardingComplete: boolean;
  minimumSetupComplete: boolean;
  plannerCounts: {
    goals: number;
    habits: number;
    tasks: number;
    weeklyReviews: number;
  };
  remindersEnabled: boolean;
};

export type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    verifiedUsers: number;
    onboardingIncomplete: number;
    firstStepsIncomplete: number;
    reminderEnabledUsers: number;
    failedReminders: number;
    recentWeeklyReviews: number;
  };
  users: AdminUserRow[];
  filters: AdminDashboardFilters;
};

export type AdminUserDetail = {
  user: AdminUserRow & {
    bio: string | null;
    avatarUrl: string | null;
    providers: string[];
    reminderTime: string | null;
    reminderTimezone: string | null;
    reminderCadence: string | null;
    hasPasswordAuth: boolean;
  };
  recentGoals: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentHabits: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentTasks: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentReviews: Array<{ id: string; reviewWeekStart: string; completedAt: string | null; reflection: string | null }>;
  reminderDeliveries: Array<{ id: string; status: string; cadence: string; scheduledFor: string; sentAt: string | null; failureReason: string | null }>;
  auditLog: Array<{ id: string; action: string; createdAt: string; actorEmail: string | null; metadata: unknown }>;
};

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

type AdminUserRecord = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  role: "USER" | "TESTER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: Date;
  emailVerified: Date | null;
  onboardingPreference: { onboardingCompletedAt: Date | null } | null;
  reminderPreference: { enabled: boolean } | null;
  _count: { goals: number; habits: number; tasks: number; weeklyReviews: number };
};

function buildUserRow(record: AdminUserRecord): AdminUserRow {
  const minimumSetup = getMinimumSetupStateFromCounts({
    goals: record._count.goals,
    habits: record._count.habits,
    tasks: record._count.tasks
  });

  return {
    id: record.id,
    email: record.email,
    username: record.username,
    name: record.name,
    role: record.role,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    emailVerifiedAt: toIsoString(record.emailVerified),
    onboardingComplete: Boolean(record.onboardingPreference?.onboardingCompletedAt),
    minimumSetupComplete: minimumSetup.isComplete,
    plannerCounts: {
      goals: record._count.goals,
      habits: record._count.habits,
      tasks: record._count.tasks,
      weeklyReviews: record._count.weeklyReviews
    },
    remindersEnabled: Boolean(record.reminderPreference?.enabled)
  };
}

export async function getAdminDashboard(filters: AdminDashboardFilters): Promise<AdminDashboardData> {
  const query = filters.query?.trim();
  const where = {
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { username: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [users, totalUsers, verifiedUsers, onboardingIncomplete, reminderEnabledUsers, failedReminders, recentWeeklyReviews] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        onboardingPreference: {
          select: { onboardingCompletedAt: true }
        },
        reminderPreference: {
          select: { enabled: true }
        },
        _count: {
          select: {
            goals: true,
            habits: true,
            tasks: true,
            weeklyReviews: true
          }
        }
      },
      take: 50
    }),
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { onboardingPreference: { is: { onboardingCompletedAt: null } } } }),
    prisma.reminderPreference.count({ where: { enabled: true } }),
    prisma.reminderDelivery.count({ where: { status: "FAILED" } }),
    prisma.weeklyReview.count({ where: { completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  ]);

  const rows = users.map((user) => buildUserRow(user));
  const firstStepsIncomplete = await prisma.user.count({
    where: {
      onboardingPreference: {
        is: {
          onboardingCompletedAt: { not: null }
        }
      },
      goals: { none: {} },
      AND: [{ habits: { none: {} } }, { tasks: { none: {} } }]
    }
  });

  return {
    metrics: {
      totalUsers,
      verifiedUsers,
      onboardingIncomplete,
      firstStepsIncomplete,
      reminderEnabledUsers,
      failedReminders,
      recentWeeklyReviews
    },
    users: rows,
    filters
  };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      accounts: { select: { provider: true } },
      onboardingPreference: { select: { onboardingCompletedAt: true } },
      reminderPreference: true,
      _count: {
        select: {
          goals: true,
          habits: true,
          tasks: true,
          weeklyReviews: true
        }
      }
    }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const [goals, habits, tasks, reviews, deliveries, auditLog] = await Promise.all([
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
    prisma.weeklyReview.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reviewWeekStart: true, completedAt: true, reflection: true } }),
    prisma.reminderDelivery.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, status: true, cadence: true, scheduledFor: true, sentAt: true, failureReason: true } }),
    prisma.adminAuditLog.findMany({
      where: { targetUserId: userId },
      include: { actorUser: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const providers = Array.from(
    new Set([...(user.passwordHash ? ["credentials"] : []), ...user.accounts.map((account) => account.provider)])
  ).sort();

  return {
    user: {
      ...buildUserRow(user),
      bio: user.profile?.bio ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      providers,
      reminderTime: user.reminderPreference?.timeOfDay ?? null,
      reminderTimezone: user.reminderPreference?.timezone ?? null,
      reminderCadence: user.reminderPreference?.cadence ?? null,
      hasPasswordAuth: Boolean(user.passwordHash)
    },
    recentGoals: goals.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    recentHabits: habits.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    recentTasks: tasks.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    recentReviews: reviews.map((item) => ({
      id: item.id,
      reviewWeekStart: item.reviewWeekStart.toISOString(),
      completedAt: toIsoString(item.completedAt),
      reflection: item.reflection ?? null
    })),
    reminderDeliveries: deliveries.map((item) => ({
      id: item.id,
      status: item.status,
      cadence: item.cadence,
      scheduledFor: item.scheduledFor.toISOString(),
      sentAt: toIsoString(item.sentAt),
      failureReason: item.failureReason ?? null
    })),
    auditLog: auditLog.map((item) => ({
      id: item.id,
      action: item.action,
      createdAt: item.createdAt.toISOString(),
      actorEmail: item.actorUser.email ?? null,
      metadata: item.metadata
    }))
  };
}

export async function createAdminAuditLog(input: {
  actorUserId: string;
  targetUserId?: string | null;
  action: "USER_SUSPENDED" | "USER_RESTORED" | "TESTER_GRANTED" | "TESTER_REVOKED" | "VERIFICATION_RESENT" | "PASSWORD_RESET_SENT";
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      metadata: input.metadata
    }
  });
}

