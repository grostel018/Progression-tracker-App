import type { LocalToCloudMigrationPayload, SettingsThemeValues } from "./schema";
import type { ReminderPreferenceSnapshot } from "@/features/reminders/schema";
import type { ThemePreference } from "@/lib/theme";

export type ProfileSettingsSnapshot = {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

export type ThemeSettingsSnapshot = SettingsThemeValues & {
  appliedTheme: "dark" | "light";
};

export type CloudSettingsWorkspace = {
  account: {
    email: string;
    username: string | null;
    providers: string[];
    hasPasswordAuth: boolean;
    emailVerifiedAt: string | null;
  };
  profile: ProfileSettingsSnapshot;
  theme: ThemeSettingsSnapshot;
  reminders: ReminderPreferenceSnapshot;
  workspace: {
    isEmpty: boolean;
    hasCompletedOnboarding: boolean;
    minimumSetupComplete: boolean;
    counts: {
      categories: number;
      dreams: number;
      goals: number;
      habits: number;
      tasks: number;
      weeklyReviews: number;
    };
  };
};

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type ThemeActionState = SettingsActionState & {
  preference?: ThemePreference;
  appliedTheme?: "dark" | "light";
};

export type AvatarActionState = SettingsActionState & {
  avatarUrl?: string | null;
};

export type ReminderActionState = SettingsActionState & {
  reminders?: ReminderPreferenceSnapshot;
};

export type MigrationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  importedCounts?: {
    categories: number;
    dreams: number;
    goals: number;
    habits: number;
    tasks: number;
    weeklyReviews: number;
  };
};

export type LocalMigrationSnapshot = {
  supported: boolean;
  hasLocalData: boolean;
  keyCount: number;
  payload: LocalToCloudMigrationPayload;
  counts: {
    onboardingSteps: number;
    categories: number;
    dreams: number;
    goals: number;
    habits: number;
    tasks: number;
    weeklyReviews: number;
  };
};
