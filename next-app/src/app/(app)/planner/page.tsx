import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { LocalSetupGate } from "@/features/first-steps/components/local-setup-gate";
import { CloudPlannerWorkspace } from "@/features/planning/components/cloud-planner-workspace";
import { LocalPlannerWorkspace } from "@/features/planning/components/local-planner-workspace";
import { getCloudPlanningSnapshot } from "@/features/planning/service";
import { getAccessContext } from "@/lib/auth/session";
import { getCloudSetupGate } from "@/features/workspace/cloud-setup";

export const metadata: Metadata = {
  title: "Planner",
  description: "Review dreams, goals, habits, and tasks in one planning workspace."
};

export default async function PlannerPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  if (access.hasLocalAccess) {
    return (
      <main className="section-shell py-8 sm:py-10" id="main-content">
        <LocalSetupGate>
          <LocalPlannerWorkspace displayName="Local workspace" statusText="Tracking node active on this device" />
        </LocalSetupGate>
      </main>
    );
  }

  if (!access.cloudUser) {
    redirect(ROUTES.signIn);
  }

  const gate = await getCloudSetupGate(access.cloudUser.id);

  if (!gate.onboardingComplete) {
    redirect(ROUTES.onboarding);
  }

  if (!gate.minimumSetupComplete) {
    redirect(ROUTES.firstSteps);
  }

  const snapshot = await getCloudPlanningSnapshot(access.cloudUser.id);

  return (
    <main className="section-shell py-8 sm:py-10" id="main-content">
      <CloudPlannerWorkspace
        displayName={access.cloudUser.username?.trim() || access.cloudUser.email}
        initialSnapshot={snapshot}
        statusText="Execution surface active"
      />
    </main>
  );
}
