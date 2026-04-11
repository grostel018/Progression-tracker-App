import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { LocalSetupGate } from "@/features/first-steps/components/local-setup-gate";
import { getAccessContext } from "@/lib/auth/session";
import { LocalWeeklyReviewWorkspace } from "@/features/local-mode/components/local-weekly-review-workspace";
import { CloudWeeklyReviewWorkspace } from "@/features/weekly-review/components/cloud-weekly-review-workspace";
import { getCloudWeeklyReviewWorkspace } from "@/features/weekly-review/service";
import { getCloudSetupGate } from "@/features/workspace/cloud-setup";

export default async function WeeklyReviewPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  if (access.hasLocalAccess) {
    return (
      <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
        <LocalSetupGate>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="bg-background-elevated/80">
              <CardHeader>
                <Badge variant="muted">Improvement loop</Badge>
                <CardTitle className="text-2xl" level={2}>
                  Weekly review is now a real product surface.
                </CardTitle>
                <CardDescription>
                  The app can now summarize the current week, surface wins and missed areas, and store an optional reflection note against that review.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-primary/16 bg-primary/8">
              <CardHeader>
                <Badge variant="success">Milestone 9</Badge>
                <CardTitle className="text-2xl" level={2}>
                  Reflection is now live.
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted">
                Weekly review now builds directly on the dashboard activity foundation instead of sitting as a roadmap placeholder.
              </CardContent>
            </Card>
          </section>

          <LocalWeeklyReviewWorkspace />
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

  const workspace = await getCloudWeeklyReviewWorkspace(access.cloudUser.id);

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Improvement loop</Badge>
            <CardTitle className="text-2xl" level={2}>
              Weekly review is now a real product surface.
            </CardTitle>
            <CardDescription>
              The app can now summarize the current week, surface wins and missed areas, and store an optional reflection note against that review.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="success">Milestone 9</Badge>
            <CardTitle className="text-2xl" level={2}>
              Reflection is now live.
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted">
            Weekly review now builds directly on the dashboard activity foundation instead of sitting as a roadmap placeholder.
          </CardContent>
        </Card>
      </section>

      <CloudWeeklyReviewWorkspace initialWorkspace={workspace} />
    </main>
  );
}
