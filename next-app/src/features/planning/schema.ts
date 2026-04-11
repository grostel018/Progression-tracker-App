import { z } from "zod";

import {
  CATEGORY_STATUSES,
  DREAM_STATUSES,
  GOAL_PROGRESS_TYPES,
  GOAL_STATUSES,
  HABIT_FREQUENCIES,
  HABIT_STATUSES,
  TASK_STATUSES
} from "@/types/planning";

export const categoryStatusEnum = z.enum(CATEGORY_STATUSES);
export const dreamStatusEnum = z.enum(DREAM_STATUSES);
export const goalStatusEnum = z.enum(GOAL_STATUSES);
export const goalProgressTypeEnum = z.enum(GOAL_PROGRESS_TYPES);
export const habitStatusEnum = z.enum(HABIT_STATUSES);
export const habitFrequencyEnum = z.enum(HABIT_FREQUENCIES);
export const taskStatusEnum = z.enum(TASK_STATUSES);

const isoDateString = z.string().datetime();
const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const localDateTimeWithSecondsPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const calendarDateString = z.string().regex(localDatePattern, "Use a valid date.");

function normalizeDateTimeInput(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (localDatePattern.test(trimmed)) {
    const normalized = new Date(`${trimmed}T00:00:00`);

    if (!Number.isNaN(normalized.getTime())) {
      return normalized.toISOString();
    }
  }

  if (localDateTimePattern.test(trimmed) || localDateTimeWithSecondsPattern.test(trimmed)) {
    const normalized = new Date(trimmed);

    if (!Number.isNaN(normalized.getTime())) {
      return normalized.toISOString();
    }
  }

  const parsed = z.string().datetime().safeParse(trimmed);
  return parsed.success ? parsed.data : undefined;
}

const optionalDateTimeInput = z.union([z.string(), z.undefined()]).transform((value, context) => {
  const normalized = normalizeDateTimeInput(value ?? "");

  if (typeof value === "string" && value.trim() && !normalized) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use a valid date."
    });
    return z.NEVER;
  }

  return normalized;
});

const optionalTrimmedString = z.union([z.string().trim().min(1), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined));
const optionalRelationId = z.union([z.string().trim().min(1), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined));
const optionalCalendarDateInput = z.union([calendarDateString, z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined));
const normalizedCustomDaysInput = z.array(z.number().int().min(0).max(6)).optional().nullable().transform((value) => (value ? Array.from(new Set(value)).sort((left, right) => left - right) : undefined));
const categoryNameSchema = z.string().trim().min(2, "Give this category a short name.").max(80);

function validateCustomHabitDays(
  value: { customDays?: number[]; frequency: (typeof HABIT_FREQUENCIES)[number] },
  context: z.RefinementCtx
): void {
  if (value.frequency === "CUSTOM" && (!value.customDays || value.customDays.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pick at least one day for a custom habit.",
      path: ["customDays"]
    });
  }
}

const habitInputSchema = z.object({
  title: z.string().trim().min(2, "Give this habit a short title.").max(120),
  description: optionalTrimmedString,
  goalId: optionalRelationId,
  frequency: habitFrequencyEnum,
  customDays: normalizedCustomDaysInput
});

export const categoryRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  description: z.string().max(240).nullable().optional(),
  status: categoryStatusEnum,
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const dreamRecordSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(600).nullable().optional(),
  vision: z.string().max(600).nullable().optional(),
  status: dreamStatusEnum,
  targetDate: isoDateString.nullable().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const goalRecordSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1).nullable().optional(),
  dreamId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(600).nullable().optional(),
  status: goalStatusEnum,
  progressType: goalProgressTypeEnum,
  targetDate: isoDateString.nullable().optional(),
  targetValue: z.number().int().nullable().optional(),
  currentValue: z.number().int(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const goalLogRecordSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  loggedAt: isoDateString,
  progressValue: z.number().int().min(0),
  note: z.string().max(800).nullable().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const habitRecordSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(600).nullable().optional(),
  status: habitStatusEnum,
  frequency: habitFrequencyEnum,
  customDays: z.array(z.number().int().min(0).max(6)).nullable().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const taskRecordSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(600).nullable().optional(),
  status: taskStatusEnum,
  scheduledFor: isoDateString.nullable().optional(),
  completedAt: isoDateString.nullable().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const habitCompletionRecordSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  completedFor: calendarDateString,
  completedAt: isoDateString,
  createdAt: isoDateString
});

export const taskCompletionRecordSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  completedAt: isoDateString,
  createdAt: isoDateString
});

export const planningSnapshotSchema = z.object({
  categories: z.array(categoryRecordSchema).default([]),
  dreams: z.array(dreamRecordSchema).default([]),
  goals: z.array(goalRecordSchema).default([]),
  goalLogs: z.array(goalLogRecordSchema).default([]),
  habits: z.array(habitRecordSchema).default([]),
  tasks: z.array(taskRecordSchema).default([]),
  habitCompletions: z.array(habitCompletionRecordSchema).default([]),
  taskCompletions: z.array(taskCompletionRecordSchema).default([])
});

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  description: z.union([z.string().trim().max(240), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined))
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().trim().min(1)
});

export const createDreamSchema = z.object({
  title: z.string().trim().min(2, "Give this dream a short title.").max(120),
  description: optionalTrimmedString,
  vision: optionalTrimmedString,
  categoryId: optionalRelationId,
  targetDate: optionalDateTimeInput
});

export const updateDreamSchema = createDreamSchema.extend({
  id: z.string().trim().min(1)
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, "Give this goal a short title.").max(120),
  description: optionalTrimmedString,
  categoryId: optionalRelationId,
  dreamId: optionalRelationId,
  progressType: goalProgressTypeEnum,
  targetDate: optionalDateTimeInput,
  targetValue: z.union([z.coerce.number().int().positive(), z.literal(""), z.undefined(), z.null()]).transform((value) => (typeof value === "number" ? value : null))
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().trim().min(1)
});

export const createGoalLogSchema = z.object({
  goalId: z.string().trim().min(1),
  loggedAt: optionalDateTimeInput,
  progressValue: z.coerce.number().int().min(0, "Use a positive value or zero."),
  note: z.union([z.string().trim().max(800), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined))
});

export const updateGoalLogSchema = createGoalLogSchema.extend({
  id: z.string().trim().min(1)
});

export const createHabitSchema = habitInputSchema.superRefine(validateCustomHabitDays);

export const updateHabitSchema = habitInputSchema.extend({
  id: z.string().trim().min(1)
}).superRefine(validateCustomHabitDays);

export const completeHabitSchema = z.object({
  habitId: z.string().trim().min(1),
  completedFor: optionalCalendarDateInput
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Give this task a short title.").max(120),
  description: optionalTrimmedString,
  goalId: optionalRelationId,
  scheduledFor: optionalDateTimeInput
});

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string().trim().min(1)
});

export const completeTaskSchema = z.object({
  taskId: z.string().trim().min(1)
});
