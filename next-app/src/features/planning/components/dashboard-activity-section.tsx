import Link from "next/link";
import { CheckCircle2, Flame, ListTodo, Sparkles, Target, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import type { PlanningActivityInsights } from "@/features/planning/insights";

function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

type DashboardActivitySectionProps = {
  insights: PlanningActivityInsights;
  modeLabel: string;
  title: string;
  description: string;
  trailingControl?: ReactNode;
};

export function DashboardActivitySection({
  insights,
  modeLabel,
  title,
  description,
  trailingControl
}: DashboardActivitySectionProps): JSX.Element {
  const statCards = [
    {
      label: "Actions today",
      value: String(insights.completionsToday),
      detail: `${insights.habitCompletionsToday} habit checks, ${insights.taskCompletionsToday} task finishes`,
      icon: CheckCircle2
    },
    {
      label: "7-day volume",
      value: String(insights.completionsLast7Days),
      detail: `${pluralize(insights.activeDaysLast7, "active day")} in the last week`,
      icon: TrendingUp
    },
    {
      label: "Current streak",
      value: pluralize(insights.currentStreakDays, "day"),
      detail: insights.currentStreakDays > 0 ? "Keep the chain alive with one real action today." : "No streak yet today. One action starts it.",
      icon: Flame
    },
    {
      label: "Open tasks",
      value: String(insights.openTaskCount),
      detail: `${pluralize(insights.completedTaskCount, "task")} already completed`,
      icon: ListTodo
    }
  ] as const;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="primary">Activity and momentum</Badge>
          <h2 className="text-3xl leading-tight">{title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-muted">{description}</p>
        </div>
        {trailingControl ? <div className="shrink-0">{trailingControl}</div> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card className="bg-background-elevated/80" key={card.label}>
              <CardHeader>
                <div className="inline-flex size-11 items-center justify-center rounded-[1.25rem] bg-primary/12 text-primary">
                  <Icon className="size-5" />
                </div>
                <Badge variant="muted">{card.label}</Badge>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
                <CardDescription>{card.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="success">Recent activity</Badge>
            <CardTitle className="text-2xl" level={3}>
              The latest actions recorded in {modeLabel.toLowerCase()}.
            </CardTitle>
            <CardDescription>
              Habit completions and task finishes are now visible here instead of waiting for a later dashboard rewrite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.recentActivity.length === 0 ? (
              <div className="rounded-[1.45rem] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted">
                No activity is recorded yet. The planner is ready, but the dashboard only becomes honest once the first real actions are logged.
              </div>
            ) : (
              insights.recentActivity.map((entry) => (
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4" key={entry.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                        <Badge variant={entry.kind === "habit" ? "primary" : "success"}>{entry.kind === "habit" ? "Habit" : "Task"}</Badge>
                        {entry.goalTitle ? <Badge variant="muted">{entry.goalTitle}</Badge> : null}
                      </div>
                      <p className="text-sm leading-6 text-muted">{entry.detail}</p>
                    </div>
                    <p className="text-xs leading-5 text-muted/75">{formatDateTime(entry.completedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Focus lane</Badge>
            <CardTitle className="flex items-center gap-2 text-2xl" level={3}>
              <Target className="size-5 text-primary" />
              {insights.topGoalTitle ?? "No linked goal yet"}
            </CardTitle>
            <CardDescription>
              {insights.topGoalTitle
                ? `${pluralize(insights.topGoalCompletionCount, "linked action")} are already pushing this goal forward.`
                : "Link a habit or task to a goal and the dashboard can start naming where your energy is actually going."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted">
              <p className="eyebrow">Habits due today</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{insights.dueHabitsToday}</p>
              <p className="mt-2">The dashboard now understands how many active habits are scheduled for today using the same recurrence logic as the planner.</p>
            </div>
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted">
              <p className="eyebrow">All recorded actions</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{insights.totalCompletionCount}</p>
              <p className="mt-2">This is the event baseline the weekly review now uses directly.</p>
            </div>
            <Button asChild fullWidth size="lg">
              <Link href={ROUTES.planner}>
                Open planner
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

