import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@prisma/client";

import { ROUTES } from "@/constants/app";
import { buildReminderMessage, sendMail } from "@/lib/auth/email";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

import { getDefaultReminderPreferences, reminderPreferencesSchema, type ReminderPreferenceSnapshot, type ReminderPreferenceValues } from "./schema";

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function parseLocalParts(date: Date, timezone: string): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  const read = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: weekdayMap[read("weekday")] ?? 0,
    hour: Number(read("hour")),
    minute: Number(read("minute"))
  };
}

function parseTimeOfDay(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map((item) => Number(item));
  return { hour, minute };
}

function buildScheduledForDate(parts: { year: number; month: number; day: number }, timeOfDay: string): Date {
  const { hour, minute } = parseTimeOfDay(timeOfDay);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0));
}

function isReminderDue(preference: ReminderPreferenceSnapshot, now: Date): { due: boolean; scheduledFor: Date } {
  const localParts = parseLocalParts(now, preference.timezone);
  const scheduledFor = buildScheduledForDate(localParts, preference.timeOfDay);
  const target = parseTimeOfDay(preference.timeOfDay);

  if (localParts.hour !== target.hour || localParts.minute < target.minute) {
    return { due: false, scheduledFor };
  }

  if (preference.cadence === "WEEKLY" && !preference.weekdays.includes(localParts.weekday)) {
    return { due: false, scheduledFor };
  }

  return { due: true, scheduledFor };
}

function toReminderPreferenceSnapshot(record: {
  enabled: boolean;
  cadence: "DAILY" | "WEEKLY";
  timeOfDay: string;
  timezone: string;
  weekdays: Prisma.JsonValue | null;
  includeDueTasks: boolean;
  includeOverdueTasks: boolean;
  includeHabitNudges: boolean;
  includeWeeklyReviewPrompt: boolean;
  lastDispatchedAt: Date | null;
} | null | undefined): ReminderPreferenceSnapshot {
  const defaults = getDefaultReminderPreferences();

  if (!record) {
    return defaults;
  }

  const weekdays = Array.isArray(record.weekdays)
    ? record.weekdays.flatMap((value) => typeof value === "number" ? [value] : typeof value === "string" ? [Number(value)] : []).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : defaults.weekdays;

  return {
    enabled: record.enabled,
    cadence: record.cadence,
    timeOfDay: record.timeOfDay,
    timezone: record.timezone,
    weekdays: weekdays.length > 0 ? Array.from(new Set(weekdays)).sort((left, right) => left - right) : defaults.weekdays,
    includeDueTasks: record.includeDueTasks,
    includeOverdueTasks: record.includeOverdueTasks,
    includeHabitNudges: record.includeHabitNudges,
    includeWeeklyReviewPrompt: record.includeWeeklyReviewPrompt,
    lastDispatchedAt: toIsoString(record.lastDispatchedAt)
  };
}

export async function saveReminderPreferences(userId: string, input: ReminderPreferenceValues): Promise<ReminderPreferenceSnapshot> {
  const values = reminderPreferencesSchema.parse(input);
  const record = await prisma.reminderPreference.upsert({
    where: { userId },
    create: {
      userId,
      enabled: values.enabled,
      cadence: values.cadence,
      timeOfDay: values.timeOfDay,
      timezone: values.timezone,
      weekdays: values.weekdays,
      includeDueTasks: values.includeDueTasks,
      includeOverdueTasks: values.includeOverdueTasks,
      includeHabitNudges: values.includeHabitNudges,
      includeWeeklyReviewPrompt: values.includeWeeklyReviewPrompt
    },
    update: {
      enabled: values.enabled,
      cadence: values.cadence,
      timeOfDay: values.timeOfDay,
      timezone: values.timezone,
      weekdays: values.weekdays,
      includeDueTasks: values.includeDueTasks,
      includeOverdueTasks: values.includeOverdueTasks,
      includeHabitNudges: values.includeHabitNudges,
      includeWeeklyReviewPrompt: values.includeWeeklyReviewPrompt
    }
  });

  return toReminderPreferenceSnapshot(record);
}

export async function getReminderPreferencesForUser(userId: string): Promise<ReminderPreferenceSnapshot> {
  const record = await prisma.reminderPreference.findUnique({
    where: { userId }
  });

  return toReminderPreferenceSnapshot(record);
}

async function buildReminderPayload(userId: string, preferences: ReminderPreferenceSnapshot, now: Date): Promise<{
  summary: Record<string, unknown>;
  hasContent: boolean;
  subject: string;
  text: string;
  html: string;
}> {
  const dueTasks = preferences.includeDueTasks
    ? await prisma.task.findMany({
        where: {
          userId,
          status: "TODO",
          scheduledFor: {
            lte: now
          }
        },
        orderBy: {
          scheduledFor: "asc"
        },
        take: 3,
        select: {
          title: true,
          scheduledFor: true
        }
      })
    : [];

  const overdueTaskCount = preferences.includeOverdueTasks
    ? await prisma.task.count({
        where: {
          userId,
          status: "TODO",
          scheduledFor: {
            lt: now
          }
        }
      })
    : 0;

  const activeHabitCount = preferences.includeHabitNudges
    ? await prisma.habit.count({
        where: {
          userId,
          status: "ACTIVE"
        }
      })
    : 0;

  const recentReview = preferences.includeWeeklyReviewPrompt
    ? await prisma.weeklyReview.findFirst({
        where: {
          userId,
          completedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          completedAt: "desc"
        },
        select: {
          completedAt: true
        }
      })
    : null;

  const hasWeeklyReviewPrompt = preferences.includeWeeklyReviewPrompt && !recentReview;
  const hasContent = dueTasks.length > 0 || overdueTaskCount > 0 || activeHabitCount > 0 || hasWeeklyReviewPrompt;

  const summary = {
    dueTasks: dueTasks.map((task) => ({ title: task.title, scheduledFor: toIsoString(task.scheduledFor) })),
    overdueTaskCount,
    activeHabitCount,
    includeWeeklyReviewPrompt: hasWeeklyReviewPrompt
  };

  const message = buildReminderMessage({
    appUrl: getServerEnv().APP_URL ?? "http://localhost:3000",
    cadence: preferences.cadence,
    dueTasks: dueTasks.map((task) => ({ title: task.title, scheduledFor: toIsoString(task.scheduledFor) })),
    overdueTaskCount,
    activeHabitCount,
    shouldPromptWeeklyReview: hasWeeklyReviewPrompt,
    plannerUrl: ROUTES.planner,
    weeklyReviewUrl: ROUTES.weeklyReview
  });

  return {
    summary,
    hasContent,
    subject: message.subject,
    text: message.text,
    html: message.html
  };
}

export async function dispatchDueReminders(now: Date = new Date(), limit = 50): Promise<{
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      emailVerified: {
        not: null
      },
      reminderPreference: {
        is: {
          enabled: true
        }
      }
    },
    include: {
      reminderPreference: true
    },
    orderBy: {
      createdAt: "asc"
    },
    take: limit
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const preferences = toReminderPreferenceSnapshot(user.reminderPreference);
    const dueState = isReminderDue(preferences, now);

    if (!dueState.due) {
      continue;
    }

    try {
      const payload = await buildReminderPayload(user.id, preferences, now);

      if (!payload.hasContent || !user.email) {
        await prisma.reminderDelivery.upsert({
          where: {
            userId_cadence_scheduledFor: {
              userId: user.id,
              cadence: preferences.cadence,
              scheduledFor: dueState.scheduledFor
            }
          },
          create: {
            userId: user.id,
            reminderPreferenceId: user.reminderPreference?.id,
            cadence: preferences.cadence,
            scheduledFor: dueState.scheduledFor,
            status: "SKIPPED",
            summary: payload.summary as Prisma.InputJsonValue,
            failureReason: !user.email ? "User has no email address." : "No reminder content was due for this window."
          },
          update: {}
        });
        skipped += 1;
        continue;
      }

      const delivery = await sendMail({
        to: user.email,
        subject: payload.subject,
        text: payload.text,
        html: payload.html
      });

      await prisma.$transaction([
        prisma.reminderDelivery.upsert({
          where: {
            userId_cadence_scheduledFor: {
              userId: user.id,
              cadence: preferences.cadence,
              scheduledFor: dueState.scheduledFor
            }
          },
          create: {
            userId: user.id,
            reminderPreferenceId: user.reminderPreference?.id,
            cadence: preferences.cadence,
            scheduledFor: dueState.scheduledFor,
            status: "SENT",
            summary: payload.summary as Prisma.InputJsonValue,
            deliveryMode: delivery.mode,
            previewPath: delivery.previewPath,
            sentAt: now
          },
          update: {}
        }),
        prisma.reminderPreference.update({
          where: { userId: user.id },
          data: {
            lastDispatchedAt: now
          }
        })
      ]);
      sent += 1;
    } catch (error) {
      failed += 1;
      Sentry.captureException(error, {
        tags: {
          feature: "reminders",
          userId: user.id
        }
      });
      await prisma.reminderDelivery.upsert({
        where: {
          userId_cadence_scheduledFor: {
            userId: user.id,
            cadence: preferences.cadence,
            scheduledFor: dueState.scheduledFor
          }
        },
        create: {
          userId: user.id,
          reminderPreferenceId: user.reminderPreference?.id,
          cadence: preferences.cadence,
          scheduledFor: dueState.scheduledFor,
          status: "FAILED",
          failureReason: error instanceof Error ? error.message : "Unknown reminder failure."
        },
        update: {}
      });
    }
  }

  return {
    checked: users.length,
    sent,
    skipped,
    failed
  };
}
