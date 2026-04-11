import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/app";
import { getAccessContext } from "@/lib/auth/session";
import { getAdminDashboard } from "@/features/admin/service";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin operations workspace for user, setup, and product oversight."
};

export default async function AdminPage({ searchParams }: { searchParams?: { q?: string; status?: string } }): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.hasCloudSession) {
    redirect(`${ROUTES.signIn}?returnTo=${encodeURIComponent(ROUTES.admin)}`);
  }

  if (!access.canAccessAdmin) {
    redirect(ROUTES.dashboard);
  }

  const data = await getAdminDashboard({
    query: searchParams?.q,
    status: searchParams?.status === "ACTIVE" || searchParams?.status === "SUSPENDED" || searchParams?.status === "DELETED" || searchParams?.status === "ALL" ? searchParams.status : "ALL"
  });

  const metricCards = [
    { label: "Total users", value: data.metrics.totalUsers },
    { label: "Verified users", value: data.metrics.verifiedUsers },
    { label: "Onboarding incomplete", value: data.metrics.onboardingIncomplete },
    { label: "First steps incomplete", value: data.metrics.firstStepsIncomplete },
    { label: "Reminder enabled", value: data.metrics.reminderEnabledUsers },
    { label: "Failed reminders", value: data.metrics.failedReminders },
    { label: "Recent weekly reviews", value: data.metrics.recentWeeklyReviews }
  ];

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="warning">Admin operations</Badge>
            <CardTitle className="text-3xl" level={1}>See real user, setup, planner, and reminder state in one place.</CardTitle>
            <CardDescription>This view replaces the placeholder admin shell with practical product-ops visibility and safe support workflows.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="muted">Scope</Badge>
            <CardTitle className="text-2xl" level={2}>Operator clarity first</CardTitle>
            <CardDescription>Inspect setup completeness, planner state, reminder health, and account safety signals without leaving the protected admin boundary.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card className="bg-background-elevated/80" key={metric.label}>
            <CardHeader>
              <Badge variant="muted">{metric.label}</Badge>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Filters</Badge>
            <CardTitle className="text-2xl" level={2}>Search the workspace population</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]" method="get">
              <Input defaultValue={data.filters.query ?? ""} name="q" placeholder="Search by email, username, or name" />
              <select className="surface-field focus-ring min-h-11 rounded-[1rem] border px-3 py-2 text-sm text-foreground" defaultValue={data.filters.status ?? "ALL"} name="status">
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>
              <button className="focus-ring min-h-11 rounded-[1rem] bg-primary px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)] shadow-[var(--shadow-accent)] hover:bg-primary-strong" type="submit">Apply</button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Users</Badge>
            <CardTitle className="text-2xl" level={2}>Recent and matching accounts</CardTitle>
            <CardDescription>Each row surfaces setup state, planner counts, reminders, and a direct path into audited support actions.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Setup</th>
                  <th className="px-3 py-2">Planner</th>
                  <th className="px-3 py-2">Reminders</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr className="border-t border-border align-top" key={user.id}>
                    <td className="px-3 py-3 text-foreground">
                      <div className="font-semibold">{user.email ?? "No email"}</div>
                      <div className="text-muted">{user.username ?? user.name ?? "No username"}</div>
                    </td>
                    <td className="px-3 py-3"><Badge variant="muted">{user.role}</Badge></td>
                    <td className="px-3 py-3"><Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "warning" : "muted"}>{user.status}</Badge></td>
                    <td className="px-3 py-3 text-muted">{user.onboardingComplete ? (user.minimumSetupComplete ? "Ready" : "Needs first steps") : "Needs onboarding"}</td>
                    <td className="px-3 py-3 text-muted">{user.plannerCounts.goals} goals, {user.plannerCounts.habits} habits, {user.plannerCounts.tasks} tasks</td>
                    <td className="px-3 py-3 text-muted">{user.remindersEnabled ? "Enabled" : "Off"}</td>
                    <td className="px-3 py-3">
                      <Link className="text-primary underline-offset-4 hover:underline" href={`${ROUTES.admin}/users/${user.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}


