import { z } from "zod";

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const calendarDateString = z.string().regex(localDatePattern, "Use a valid date.");
const optionalTrimmedString = z.union([z.string().trim().max(2000), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined));

export const weeklyReviewSummarySnapshotSchema = z.object({
  referenceDate: calendarDateString,
  weekStart: calendarDateString,
  weekEnd: calendarDateString,
  totalCompletions: z.number().int().min(0),
  habitCompletions: z.number().int().min(0),
  taskCompletions: z.number().int().min(0),
  activeDays: z.number().int().min(0).max(7),
  scheduledHabitCount: z.number().int().min(0),
  missedHabitCount: z.number().int().min(0),
  completedTaskCount: z.number().int().min(0),
  openTaskCount: z.number().int().min(0),
  openScheduledTaskCount: z.number().int().min(0),
  currentStreakDays: z.number().int().min(0),
  topGoalTitle: z.string().max(120).nullable().optional(),
  wins: z.array(z.string().min(1).max(180)),
  missedAreas: z.array(z.string().min(1).max(180))
});

export const weeklyReviewRecordSchema = z.object({
  id: z.string().min(1),
  weekStart: calendarDateString,
  weekEnd: calendarDateString,
  reflection: z.string().max(2000).nullable().optional(),
  summarySnapshot: weeklyReviewSummarySnapshotSchema,
  completedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const saveWeeklyReviewSchema = z.object({
  weekStart: calendarDateString,
  reflection: optionalTrimmedString
});
