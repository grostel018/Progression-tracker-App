import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prismaMock: {
    reminderPreference: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    user: {
      findMany: vi.fn()
    },
    task: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    habit: {
      count: vi.fn()
    },
    weeklyReview: {
      findFirst: vi.fn()
    },
    reminderDelivery: {
      upsert: vi.fn()
    },
    $transaction: vi.fn()
  },
  sendMailMock: vi.fn(),
  captureExceptionMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prismaMock
}));

vi.mock("@/lib/auth/email", () => ({
  buildReminderMessage: vi.fn(() => ({
    subject: "Your Progression Tracker daily reminder",
    text: "Open your planner: http://localhost:3000/planner",
    html: "<p>Open your planner</p>"
  })),
  sendMail: mocks.sendMailMock
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    APP_URL: "http://localhost:3000"
  })
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureExceptionMock
}));

import { dispatchDueReminders, getReminderPreferencesForUser, saveReminderPreferences } from "@/features/reminders/service";

describe("reminder service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default preferences when none exist yet", async () => {
    mocks.prismaMock.reminderPreference.findUnique.mockResolvedValue(null);

    const result = await getReminderPreferencesForUser("user-1");

    expect(result).toMatchObject({
      enabled: false,
      cadence: "DAILY",
      timeOfDay: "09:00",
      timezone: "UTC"
    });
  });

  it("persists reminder settings", async () => {
    mocks.prismaMock.reminderPreference.upsert.mockResolvedValue({
      enabled: true,
      cadence: "WEEKLY",
      timeOfDay: "08:15",
      timezone: "Europe/Istanbul",
      weekdays: [1, 3, 5],
      includeDueTasks: true,
      includeOverdueTasks: false,
      includeHabitNudges: true,
      includeWeeklyReviewPrompt: true,
      lastDispatchedAt: null
    });

    const result = await saveReminderPreferences("user-1", {
      enabled: true,
      cadence: "WEEKLY",
      timeOfDay: "08:15",
      timezone: "Europe/Istanbul",
      weekdays: [5, 1, 3],
      includeDueTasks: true,
      includeOverdueTasks: false,
      includeHabitNudges: true,
      includeWeeklyReviewPrompt: true
    });

    expect(mocks.prismaMock.reminderPreference.upsert).toHaveBeenCalled();
    expect(result.weekdays).toEqual([1, 3, 5]);
  });

  it("dispatches a due reminder, writes a delivery record, and updates the preference timestamp", async () => {
    const now = new Date("2026-04-04T09:30:00.000Z");
    mocks.prismaMock.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        email: "person@example.com",
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        reminderPreference: {
          id: "reminder-1",
          enabled: true,
          cadence: "DAILY",
          timeOfDay: "09:00",
          timezone: "UTC",
          weekdays: [1],
          includeDueTasks: true,
          includeOverdueTasks: false,
          includeHabitNudges: false,
          includeWeeklyReviewPrompt: false,
          lastDispatchedAt: null
        }
      }
    ]);
    mocks.prismaMock.task.findMany.mockResolvedValue([
      {
        title: "Plan tomorrow",
        scheduledFor: new Date("2026-04-04T08:00:00.000Z")
      }
    ]);
    mocks.prismaMock.task.count.mockResolvedValue(0);
    mocks.prismaMock.habit.count.mockResolvedValue(0);
    mocks.prismaMock.weeklyReview.findFirst.mockResolvedValue(null);
    mocks.sendMailMock.mockResolvedValue({ mode: "preview", previewPath: ".tmp/outbox/reminder.json" });
    mocks.prismaMock.$transaction.mockResolvedValue(undefined);

    const result = await dispatchDueReminders(now, 10);

    expect(result).toEqual({ checked: 1, sent: 1, skipped: 0, failed: 0 });
    expect(mocks.sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "person@example.com",
      subject: "Your Progression Tracker daily reminder"
    }));
    expect(mocks.prismaMock.$transaction).toHaveBeenCalled();
  });
});
