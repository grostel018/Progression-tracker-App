import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { FirstStepsCloudWorkspace } from "@/features/first-steps/components/first-steps-cloud-workspace";
import { LocalFirstStepsWorkspace } from "@/features/first-steps/components/local-first-steps-workspace";
import { getAccessContext } from "@/lib/auth/session";
import { getCloudSetupGate } from "@/features/workspace/cloud-setup";

export const metadata: Metadata = {
  title: "First steps",
  description: "Create your first goal and first habit or task before entering the full workspace."
};

export default async function FirstStepsPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  if (access.hasLocalAccess) {
    return <LocalFirstStepsWorkspace />;
  }

  if (!access.cloudUser) {
    redirect(ROUTES.signIn);
  }

  const gate = await getCloudSetupGate(access.cloudUser.id);

  if (!gate.onboardingComplete) {
    redirect(ROUTES.onboarding);
  }

  if (gate.minimumSetupComplete) {
    redirect(ROUTES.dashboard);
  }

  return <FirstStepsCloudWorkspace />;
}
