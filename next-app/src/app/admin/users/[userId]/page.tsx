import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { AdminUserActionsPanel } from "@/features/admin/components/admin-user-actions-panel";
import { getAdminUserDetail } from "@/features/admin/service";
import { getAccessContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin user detail",
  description: "Inspect onboarding, planning, reminders, and support actions for one account."
};

export default async function AdminUserDetailPage({ params }: { params: { userId: string } }): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.hasCloudSession) {
    redirect(`${ROUTES.signIn}?returnTo=${encodeURIComponent(`${ROUTES.admin}/users/${params.userId}`)}`);
  }

  if (!access.canAccessAdmin) {
    redirect(ROUTES.dashboard);
  }

  try {
    const detail = await getAdminUserDetail(params.userId);

    return (
      <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
        <section className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="warning">Admin user detail</Badge>
            <h1 className="text-3xl">{detail.user.email ?? "Account without email"}</h1>
            <p className="text-sm text-muted">Role: {detail.user.role} · Status: {detail.user.status} · Providers: {detail.user.providers.join(", ") || "None"}</p>
          </div>
          <Link className="text-sm text-primary underline-offset-4 hover:underline" href={ROUTES.admin}>Back to admin</Link>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="bg-background-elevated/80">
            <CardHeader>
              <Badge variant="muted">Account state</Badge>
              <CardTitle className="text-2xl" level={2}>Identity and setup summary</CardTitle>
              <CardDescription>Inspect the account, setup progression, reminder posture, and planner counts before taking any support action.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">Verified: {detail.user.emailVerifiedAt ? "Yes" : "No"}</div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">Onboarding: {detail.user.onboardingComplete ? "Complete" : "Incomplete"}</div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">First steps: {detail.user.minimumSetupComplete ? "Complete" : "Incomplete"}</div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">Reminders: {detail.user.remindersEnabled ? `${detail.user.reminderCadence ?? "Unknown"} at ${detail.user.reminderTime ?? "--:--"}` : "Disabled"}</div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">Planner counts: {detail.user.plannerCounts.goals} goals, {detail.user.plannerCounts.habits} habits, {detail.user.plannerCounts.tasks} tasks</div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">Weekly reviews: {detail.user.plannerCounts.weeklyReviews}</div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated/80">
            <CardHeader>
              <Badge variant="primary">Support actions</Badge>
              <CardTitle className="text-2xl" level={2}>Safe and auditable controls</CardTitle>
              <CardDescription>Every action taken here writes to the admin audit log.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserActionsPanel hasPasswordAuth={detail.user.hasPasswordAuth} role={detail.user.role} status={detail.user.status} userId={detail.user.id} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="bg-background-elevated/80">
            <CardHeader>
              <Badge variant="muted">Recent planner state</Badge>
              <CardTitle className="text-2xl" level={2}>Goals, habits, and tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <div>
                <p className="font-semibold text-foreground">Goals</p>
                {detail.recentGoals.map((item) => <p key={item.id}>{item.title} · {item.status}</p>)}
              </div>
              <div>
                <p className="font-semibold text-foreground">Habits</p>
                {detail.recentHabits.map((item) => <p key={item.id}>{item.title} · {item.status}</p>)}
              </div>
              <div>
                <p className="font-semibold text-foreground">Tasks</p>
                {detail.recentTasks.map((item) => <p key={item.id}>{item.title} · {item.status}</p>)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated/80">
            <CardHeader>
              <Badge variant="muted">Recent review and reminders</Badge>
              <CardTitle className="text-2xl" level={2}>Weekly reviews and deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <div>
                <p className="font-semibold text-foreground">Weekly reviews</p>
                {detail.recentReviews.map((item) => <p key={item.id}>{item.reviewWeekStart.slice(0, 10)} · {item.completedAt ? "Completed" : "Draft"}</p>)}
              </div>
              <div>
                <p className="font-semibold text-foreground">Reminder deliveries</p>
                {detail.reminderDeliveries.map((item) => <p key={item.id}>{item.cadence} · {item.status} · {item.scheduledFor.slice(0, 16).replace("T", " ")}</p>)}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-background-elevated/80">
            <CardHeader>
              <Badge variant="muted">Audit log</Badge>
              <CardTitle className="text-2xl" level={2}>Recorded support history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              {detail.auditLog.length === 0 ? <p>No audited actions recorded for this user yet.</p> : detail.auditLog.map((item) => (
                <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-3" key={item.id}>
                  <p className="font-semibold text-foreground">{item.action}</p>
                  <p>{item.createdAt.slice(0, 16).replace("T", " ")} · by {item.actorEmail ?? "Unknown actor"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}

