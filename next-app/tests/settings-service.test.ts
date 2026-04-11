import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    profile: {
      upsert: vi.fn()
    },
    reminderPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn()
    },
    category: {
      count: vi.fn()
    },
    dream: {
      count: vi.fn()
    },
    goal: {
      count: vi.fn()
    },
    habit: {
      count: vi.fn()
    },
    task: {
      count: vi.fn()
    },
    weeklyReview: {
      count: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock
}));

import { importLocalWorkspaceToCloud, getCloudSettingsWorkspace, updateCloudSettingsProfile } from "@/features/settings/service";

describe("settings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.reminderPreference.findUnique.mockResolvedValue(null);
  });

  it("builds a cloud settings snapshot and treats a blank workspace as empty", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      username: "person",
      name: "Person",
      passwordHash: "hash",
      emailVerified: new Date("2026-04-04T10:00:00.000Z"),
      profile: {
        displayName: "Person",
        bio: "Working on steady progress."
      },
      accounts: [{ provider: "google" }],
      onboardingPreference: {
        focusArea: null,
        motivationStyle: null,
        dailyCommitmentMinutes: null,
        primaryObstacle: null,
        ninetyDayVision: null,
        completedStepIds: [],
        onboardingCompletedAt: null
      }
    });
    prismaMock.$transaction.mockResolvedValue([0, 0, 0, 0, 0, 0]);

    const workspace = await getCloudSettingsWorkspace("user-1");

    expect(workspace.account.providers).toEqual(["credentials", "google"]);
    expect(workspace.profile.displayName).toBe("Person");
    expect(workspace.workspace.isEmpty).toBe(true);
    expect(workspace.workspace.counts.tasks).toBe(0);
  });

  it("marks the workspace as non-empty when onboarding has completed data", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      username: null,
      name: null,
      passwordHash: null,
      emailVerified: null,
      profile: null,
      accounts: [],
      onboardingPreference: {
        focusArea: "health",
        motivationStyle: null,
        dailyCommitmentMinutes: null,
        primaryObstacle: null,
        ninetyDayVision: null,
        completedStepIds: ["focus-area"],
        onboardingCompletedAt: null
      }
    });
    prismaMock.$transaction.mockResolvedValue([0, 0, 0, 0, 0, 0]);

    const workspace = await getCloudSettingsWorkspace("user-1");

    expect(workspace.workspace.isEmpty).toBe(false);
  });

  it("updates the user profile details", async () => {
    prismaMock.user.update.mockResolvedValue(undefined);
    prismaMock.profile.upsert.mockResolvedValue({
      displayName: "Momentum Builder",
      bio: "Keeping one next step visible."
    });

    const profile = await updateCloudSettingsProfile("user-1", {
      displayName: "Momentum Builder",
      bio: "Keeping one next step visible."
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Momentum Builder"
      }
    });
    expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: {
        userId: "user-1",
        displayName: "Momentum Builder",
        bio: "Keeping one next step visible."
      },
      update: {
        displayName: "Momentum Builder",
        bio: "Keeping one next step visible."
      }
    });
    expect(profile).toEqual({
      displayName: "Momentum Builder",
      bio: "Keeping one next step visible.",
      avatarUrl: null
    });
  });

  it("imports local browser data into an empty cloud workspace and remaps relation ids", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      username: null,
      name: null,
      passwordHash: "hash",
      emailVerified: new Date("2026-04-04T10:00:00.000Z"),
      profile: null,
      accounts: [],
      onboardingPreference: {
        focusArea: null,
        motivationStyle: null,
        dailyCommitmentMinutes: null,
        primaryObstacle: null,
        ninetyDayVision: null,
        completedStepIds: [],
        onboardingCompletedAt: null
      }
    });

    const tx = {
      onboardingPreference: {
        upsert: vi.fn(async () => undefined)
      },
      category: {
        create: vi.fn(async () => ({ id: "category-db-1" }))
      },
      dream: {
        create: vi.fn(async () => ({ id: "dream-db-1" }))
      },
      goal: {
        create: vi.fn(async () => ({ id: "goal-db-1" }))
      },
      habit: {
        create: vi.fn(async () => ({ id: "habit-db-1" }))
      },
      task: {
        create: vi.fn(async () => ({ id: "task-db-1" }))
      },
      habitCompletion: {
        create: vi.fn(async () => undefined)
      },
      taskCompletion: {
        create: vi.fn(async () => undefined)
      },
      weeklyReview: {
        create: vi.fn(async () => undefined)
      }
    };

    prismaMock.$transaction.mockImplementation(async (value: unknown) => {
      if (Array.isArray(value)) {
        return [0, 0, 0, 0, 0, 0];
      }

      return (value as (client: typeof tx) => Promise<unknown>)(tx);
    });

    const result = await importLocalWorkspaceToCloud("user-1", {
      onboarding: {
        id: "default",
        version: 1,
        focusArea: "health",
        motivationStyle: "intrinsic",
        dailyCommitmentMinutes: 15,
        primaryObstacle: "consistency",
        ninetyDayVision: "I want a calmer weekly rhythm with visible momentum.",
        completedStepIds: ["motivation-style", "focus-area"],
        completedAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z"
      },
      planning: {
        categories: [
          {
            id: "category-local-1",
            name: "Health",
            description: "Fitness and recovery",
            status: "ACTIVE",
            createdAt: "2026-04-01T10:00:00.000Z",
            updatedAt: "2026-04-01T10:00:00.000Z"
          }
        ],
        dreams: [
          {
            id: "dream-local-1",
            categoryId: "category-local-1",
            title: "Feel stronger",
            description: "Build a durable body",
            vision: null,
            status: "ACTIVE",
            targetDate: null,
            createdAt: "2026-04-01T10:00:00.000Z",
            updatedAt: "2026-04-01T10:00:00.000Z"
          }
        ],
        goals: [
          {
            id: "goal-local-1",
            categoryId: "category-local-1",
            dreamId: "dream-local-1",
            title: "Train 3 times a week",
            description: null,
            status: "ACTIVE",
            progressType: "TARGET_COUNT",
            targetDate: null,
            targetValue: 12,
            currentValue: 4,
            createdAt: "2026-04-01T10:00:00.000Z",
            updatedAt: "2026-04-01T10:00:00.000Z"
          }
        ],
        goalLogs: [],
        habits: [
          {
            id: "habit-local-1",
            goalId: "goal-local-1",
            title: "Workout",
            description: null,
            status: "ACTIVE",
            frequency: "DAILY",
            customDays: null,
            createdAt: "2026-04-01T10:00:00.000Z",
            updatedAt: "2026-04-01T10:00:00.000Z"
          }
        ],
        tasks: [
          {
            id: "task-local-1",
            goalId: "goal-local-1",
            title: "Meal prep",
            description: null,
            status: "DONE",
            scheduledFor: "2026-04-02T00:00:00.000Z",
            completedAt: "2026-04-02T18:00:00.000Z",
            createdAt: "2026-04-01T10:00:00.000Z",
            updatedAt: "2026-04-02T18:00:00.000Z"
          }
        ],
        habitCompletions: [
          {
            id: "habit-completion-local-1",
            habitId: "habit-local-1",
            completedFor: "2026-04-02",
            completedAt: "2026-04-02T18:00:00.000Z",
            createdAt: "2026-04-02T18:00:00.000Z"
          }
        ],
        taskCompletions: [
          {
            id: "task-completion-local-1",
            taskId: "task-local-1",
            completedAt: "2026-04-02T18:00:00.000Z",
            createdAt: "2026-04-02T18:00:00.000Z"
          }
        ]
      },
      weeklyReviews: [
        {
          id: "weekly-review-local-1",
          weekStart: "2026-03-30",
          weekEnd: "2026-04-05",
          reflection: "Strong week.",
          summarySnapshot: {
            referenceDate: "2026-04-04",
            weekStart: "2026-03-30",
            weekEnd: "2026-04-05",
            totalCompletions: 2,
            habitCompletions: 1,
            taskCompletions: 1,
            activeDays: 1,
            scheduledHabitCount: 1,
            missedHabitCount: 0,
            completedTaskCount: 1,
            openTaskCount: 0,
            openScheduledTaskCount: 0,
            currentStreakDays: 1,
            topGoalTitle: "Train 3 times a week",
            wins: ["You showed up."],
            missedAreas: []
          },
          completedAt: "2026-04-04T20:00:00.000Z",
          createdAt: "2026-04-04T20:00:00.000Z",
          updatedAt: "2026-04-04T20:00:00.000Z"
        }
      ]
    });

    expect(tx.dream.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        categoryId: "category-db-1"
      })
    }));
    expect(tx.goal.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        categoryId: "category-db-1",
        dreamId: "dream-db-1"
      })
    }));
    expect(tx.habit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        goalId: "goal-db-1"
      })
    }));
    expect(tx.task.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        goalId: "goal-db-1",
        status: "DONE"
      })
    }));
    expect(tx.habitCompletion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        habitId: "habit-db-1"
      })
    }));
    expect(tx.taskCompletion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        taskId: "task-db-1"
      })
    }));
    expect(tx.weeklyReview.create).toHaveBeenCalledTimes(1);
    expect(result.importedCounts).toEqual({
      categories: 1,
      dreams: 1,
      goals: 1,
      habits: 1,
      tasks: 1,
      weeklyReviews: 1
    });
  });
});


