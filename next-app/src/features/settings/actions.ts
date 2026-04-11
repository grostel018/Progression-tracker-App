"use server";

import { cookies } from "next/headers";
import { ZodError } from "zod";

import { getAccessContext } from "@/lib/auth/session";
import { normalizeThemePreference, resolveAppliedTheme, THEME_COOKIE } from "@/lib/theme";
import { getServerEnv } from "@/lib/env";
import { readReminderPreferencesFormData } from "@/features/reminders/schema";

import {
  settingsProfileSchema,
  settingsThemeSchema,
  type LocalToCloudMigrationPayload,
  type SettingsProfileValues,
  type SettingsThemeValues
} from "./schema";
import {
  CLOUD_WORKSPACE_NOT_EMPTY,
  importLocalWorkspaceToCloud,
  LOCAL_MIGRATION_EMPTY,
  removeAvatarForUser,
  saveAvatarForUser,
  saveCloudReminderPreferences,
  saveThemePreferenceForUser,
  updateCloudSettingsProfile
} from "./service";
import type { AvatarActionState, MigrationActionState, ReminderActionState, SettingsActionState, ThemeActionState } from "./types";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

async function requireCloudUserId(): Promise<string> {
  const access = await getAccessContext();

  if (!access.cloudUser?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return access.cloudUser.id;
}

export async function saveSettingsProfile(input: SettingsProfileValues): Promise<SettingsActionState> {
  try {
    const userId = await requireCloudUserId();
    const values = settingsProfileSchema.parse(input);
    await updateCloudSettingsProfile(userId, values);

    return {
      status: "success",
      message: "Your profile details were saved.",
      fieldErrors: {}
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "We could not save your profile right now."
    };
  }
}

export async function saveThemePreferenceAction(input: SettingsThemeValues): Promise<ThemeActionState> {
  try {
    const values = settingsThemeSchema.parse(input);
    const access = await getAccessContext();
    const snapshot = await saveThemePreferenceForUser(access.cloudUser?.id ?? null, values.preference);

    cookies().set(THEME_COOKIE, values.preference, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: getServerEnv().NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365
    });

    return {
      status: "success",
      message: "Theme preference saved.",
      preference: snapshot.preference,
      appliedTheme: snapshot.appliedTheme
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Choose a valid theme preference.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "We could not save the theme preference right now."
    };
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionState> {
  try {
    const userId = await requireCloudUserId();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return {
        status: "error",
        message: "Choose an image file to upload."
      };
    }

    const profile = await saveAvatarForUser(userId, file);

    return {
      status: "success",
      message: "Your profile image was updated.",
      avatarUrl: profile.avatarUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "AVATAR_TOO_LARGE") {
        return { status: "error", message: "Profile images must stay under 2 MB." };
      }

      if (error.message === "UNSUPPORTED_AVATAR_TYPE" || error.message === "UNSUPPORTED_AVATAR_SIGNATURE") {
        return { status: "error", message: "Use a valid PNG, JPEG, or WebP image." };
      }

      if (error.message === "STORAGE_NOT_CONFIGURED") {
        return { status: "error", message: "Image storage is not configured yet for this environment." };
      }
    }

    return {
      status: "error",
      message: "We could not update the profile image right now."
    };
  }
}

export async function removeAvatarAction(): Promise<AvatarActionState> {
  try {
    const userId = await requireCloudUserId();
    await removeAvatarForUser(userId);

    return {
      status: "success",
      message: "Your profile image was removed.",
      avatarUrl: null
    };
  } catch {
    return {
      status: "error",
      message: "We could not remove the profile image right now."
    };
  }
}

export async function saveReminderPreferencesAction(formData: FormData): Promise<ReminderActionState> {
  try {
    const userId = await requireCloudUserId();
    const values = readReminderPreferencesFormData(formData);
    const reminders = await saveCloudReminderPreferences(userId, values);

    return {
      status: "success",
      message: "Reminder preferences saved.",
      reminders
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Check the reminder fields and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "We could not save reminder preferences right now."
    };
  }
}

export async function importSettingsLocalWorkspace(payload: LocalToCloudMigrationPayload): Promise<MigrationActionState> {
  try {
    const userId = await requireCloudUserId();
    const result = await importLocalWorkspaceToCloud(userId, payload);

    return {
      status: "success",
      message: "Local browser data was imported into your cloud workspace.",
      importedCounts: result.importedCounts
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === LOCAL_MIGRATION_EMPTY) {
        return {
          status: "error",
          message: "There is no local workspace data in this browser to import yet."
        };
      }

      if (error.message === CLOUD_WORKSPACE_NOT_EMPTY) {
        return {
          status: "error",
          message: "This cloud workspace already has data, so import is only allowed into a fresh account."
        };
      }
    }

    return {
      status: "error",
      message: "We could not import your local workspace right now."
    };
  }
}
