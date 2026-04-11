import { z } from "zod";

const timeOfDayPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const coerceBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on";
  }

  return false;
}, z.boolean());

const weekdaySchema = z.array(z.coerce.number().int().min(0).max(6)).default([]).transform((value) => Array.from(new Set(value)).sort((left, right) => left - right));

export const reminderPreferencesSchema = z.object({
  enabled: coerceBoolean,
  cadence: z.enum(["DAILY", "WEEKLY"]),
  timeOfDay: z.string().regex(timeOfDayPattern, "Use a valid reminder time."),
  timezone: z.string().trim().min(2, "Choose a valid timezone."),
  weekdays: weekdaySchema,
  includeDueTasks: coerceBoolean,
  includeOverdueTasks: coerceBoolean,
  includeHabitNudges: coerceBoolean,
  includeWeeklyReviewPrompt: coerceBoolean
}).superRefine((value, context) => {
  if (value.cadence === "WEEKLY" && value.weekdays.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weekdays"],
      message: "Pick at least one weekday for weekly reminders."
    });
  }
});

export type ReminderPreferenceValues = z.infer<typeof reminderPreferencesSchema>;

export type ReminderPreferenceSnapshot = ReminderPreferenceValues & {
  lastDispatchedAt: string | null;
};

export function getDefaultReminderPreferences(): ReminderPreferenceSnapshot {
  return {
    enabled: false,
    cadence: "DAILY",
    timeOfDay: "09:00",
    timezone: "UTC",
    weekdays: [1],
    includeDueTasks: true,
    includeOverdueTasks: true,
    includeHabitNudges: true,
    includeWeeklyReviewPrompt: true,
    lastDispatchedAt: null
  };
}

export function readReminderPreferencesFormData(formData: FormData): ReminderPreferenceValues {
  return reminderPreferencesSchema.parse({
    enabled: formData.get("enabled") ?? false,
    cadence: formData.get("cadence") ?? "DAILY",
    timeOfDay: formData.get("timeOfDay") ?? "09:00",
    timezone: formData.get("timezone") ?? "UTC",
    weekdays: formData.getAll("weekdays"),
    includeDueTasks: formData.get("includeDueTasks") ?? false,
    includeOverdueTasks: formData.get("includeOverdueTasks") ?? false,
    includeHabitNudges: formData.get("includeHabitNudges") ?? false,
    includeWeeklyReviewPrompt: formData.get("includeWeeklyReviewPrompt") ?? false
  });
}
