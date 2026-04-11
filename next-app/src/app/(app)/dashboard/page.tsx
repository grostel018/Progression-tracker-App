import { redirect } from "next/navigation";


import { WorkspaceShell } from "@/components/shared/workspace-shell";
import { ROUTES } from "@/constants/app";
import { LocalSetupGate } from "@/features/first-steps/components/local-setup-gate";
import { LocalDashboardCommandCenter } from "@/features/planning/components/local-dashboard-command-center";
import { DashboardCommandCenter } from "@/features/planning/components/dashboard-command-center";
import { getCloudPlanningSnapshot } from "@/features/planning/service";
import { getAccessContext } from "@/lib/auth/session";
import { getCloudSetupGate } from "@/features/workspace/cloud-setup";
import { getCloudOnboardingState } from "@/features/onboarding/service";

const workspaceLinks = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: "dashboard" },
  { href: ROUTES.planner, label: "Planner", icon: "goals" },
  { href: ROUTES.weeklyReview, label: "Weekly review", icon: "review" },
  { href: ROUTES.settings, label: "Settings", icon: "settings" }
] as const;

const dashboardSections = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "history", label: "History", icon: "activity" },
  { id: "summaries", label: "Summaries", icon: "dreams" },
  { id: "recent-activity", label: "Recent activity", icon: "goals" }
] as const;

export default async function DashboardPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  if (access.hasLocalAccess) {
    return (
      <main className="section-shell py-8 sm:py-10" id="main-content">
        <LocalSetupGate>
          <WorkspaceShell
            detailPanel={{
              title: "Local progress flow is live.",
              body: "This browser now carries planner entities, manual goal logs, habit completions, and task history, so the dashboard can behave like a real command center instead of a placeholder shell."
            }}
            displayName="Local workspace"
            modeLabel="Local mode"
            sectionLabel="Dashboard sections"
            sectionLinks={dashboardSections}
            statusText="Tracking node active on this device"
            workspaceLabel="Workspace"
            workspaceLinks={workspaceLinks}
          >
            <LocalDashboardCommandCenter />
          </WorkspaceShell>
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

  const [snapshot, onboarding] = await Promise.all([
    getCloudPlanningSnapshot(access.cloudUser.id),
    getCloudOnboardingState(access.cloudUser.id)
  ]);
  const displayName = access.cloudUser.username?.trim() || access.cloudUser.email;
  const focusText = onboarding?.focusArea ? `${onboarding.focusArea} focus aligned` : "Tracking node active";

  return (
    <main className="section-shell py-8 sm:py-10" id="main-content">
      <WorkspaceShell
        detailPanel={{
          title: "The dashboard now reflects stored proof.",
          body: "The command center reads the same planner, manual-log, habit, and task history as the rest of the app, so reviewing momentum no longer depends on placeholder copy."
        }}
        displayName={displayName}
        modeLabel="Cloud mode"
        sectionLabel="Dashboard sections"
        sectionLinks={dashboardSections}
        statusText={focusText}
        workspaceLabel="Workspace"
        workspaceLinks={workspaceLinks}
      >
        <DashboardCommandCenter isLocalMode={false} snapshot={snapshot} />
      </WorkspaceShell>
    </main>
  );
}

