import { z } from "zod";

import { localOnboardingAnswersSchema } from "@/features/onboarding/schema";
import { planningSnapshotSchema } from "@/features/planning/schema";
import { reminderPreferencesSchema } from "@/features/reminders/schema";
import { weeklyReviewRecordSchema } from "@/features/weekly-review/schema";
import { THEME_PREFERENCES } from "@/lib/theme";

export const settingsProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep the name under 80 characters."),
  bio: z.union([z.string().trim().max(280, "Keep the bio under 280 characters."), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined))
});

export const settingsThemeSchema = z.object({
  preference: z.enum(THEME_PREFERENCES)
});

export const localToCloudMigrationPayloadSchema = z.object({
  onboarding: localOnboardingAnswersSchema.nullable(),
  planning: planningSnapshotSchema,
  weeklyReviews: z.array(weeklyReviewRecordSchema).default([])
});

export { reminderPreferencesSchema };

export type LocalToCloudMigrationPayload = z.infer<typeof localToCloudMigrationPayloadSchema>;
export type SettingsProfileValues = z.infer<typeof settingsProfileSchema>;
export type SettingsThemeValues = z.infer<typeof settingsThemeSchema>;
export type ReminderPreferenceValues = z.infer<typeof reminderPreferencesSchema>;

export function hasMeaningfulMigrationData(payload: LocalToCloudMigrationPayload): boolean {
  const onboarding = payload.onboarding;
  const planning = payload.planning;

  const hasOnboardingData = Boolean(
    onboarding
      && (
        onboarding.completedStepIds.length > 0
        || onboarding.completedAt
        || onboarding.focusArea
        || onboarding.motivationStyle
        || onboarding.dailyCommitmentMinutes
        || onboarding.primaryObstacle
        || onboarding.ninetyDayVision
      )
  );
  const hasPlanningData = planning.categories.length > 0
    || planning.dreams.length > 0
    || planning.goals.length > 0
    || planning.habits.length > 0
    || planning.tasks.length > 0
    || planning.habitCompletions.length > 0
    || planning.taskCompletions.length > 0;

  return hasOnboardingData || hasPlanningData || payload.weeklyReviews.length > 0;
}
