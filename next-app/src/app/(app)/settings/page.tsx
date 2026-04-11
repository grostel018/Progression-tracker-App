import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { SettingsCloudWorkspace } from "@/features/settings/components/settings-cloud-workspace";
import { SettingsLocalWorkspace } from "@/features/settings/components/settings-local-workspace";
import { getCloudSettingsWorkspace } from "@/features/settings/service";
import { getAccessContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account details, profile info, and workspace migration controls."
};

export default async function SettingsPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  if (access.hasLocalAccess) {
    return <SettingsLocalWorkspace />;
  }

  if (!access.cloudUser) {
    redirect(ROUTES.signIn);
  }

  try {
    const workspace = await getCloudSettingsWorkspace(access.cloudUser.id);

    return <SettingsCloudWorkspace initialWorkspace={workspace} />;
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      redirect(ROUTES.signIn);
    }

    throw error;
  }
}
