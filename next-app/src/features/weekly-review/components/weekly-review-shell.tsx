import Link from "next/link";
import { CalendarRange, CheckCircle2, Flame, NotebookPen, Sparkles, TriangleAlert, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { PlannerEmptyState } from "@/features/planning/components/planner-feedback";
import type { WeeklyReviewWorkspace } from "@/types/weekly-review";

function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${dateValue}T00:00:00`));
}

type WeeklyReviewShellProps = {
  modeLabel: string;
  workspace: WeeklyReviewWorkspace;
  reviewForm: ReactNode;
  status: ReactNode;
};

export function WeeklyReviewShell({ modeLabel, workspace, reviewForm, status }: WeeklyReviewShellProps): JSX.Element {
  const { insights, recentReviews } = workspace;
  const statCards = [
    {
      label: "Actions this week",
      value: String(insights.totalCompletions),
      detail: `${insights.habitCompletions} habits, ${insights.taskCompletions} tasks`,
      icon: CheckCircle2
    },
    {
      label: "Active days",
      value: pluralize(insights.activeDays, "day"),
      detail: `${pluralize(insights.currentStreakDays, "day")} current streak`,
      icon: Flame
    },
    {
      label: "Missed habits",
      value: String(insights.missedHabitCount),
      detail: `${pluralize(insights.scheduledHabitCount, "scheduled habit check")} tracked so far`,
      icon: TriangleAlert
    },
    {
      label: "Open tasks",
      value: String(insights.openTaskCount),
      detail: `${pluralize(insights.openScheduledTaskCount, "scheduled task")} still open from this week`,
      icon: NotebookPen
    }
  ] as const;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <Badge variant="primary">Weekly review</Badge>
        <h1 className="max-w-[14ch] text-4xl leading-tight sm:text-5xl">Review the week while the activity trail is still fresh.</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          This screen turns stored planner history into a weekly improvement loop for the {modeLabel.toLowerCase()}. The summary is derived from the same habit and task completion data that already powers the dashboard.
        </p>
      </div>

      <Card className="border-primary/16 bg-primary/8">
        <CardHeader>
          <Badge variant="success">Current review window</Badge>
          <CardTitle className="flex items-center gap-2 text-2xl" level={2}>
            <CalendarRange className="size-5 text-primary" />
            {formatDate(insights.weekStart)} to {formatDate(insights.weekEnd)}
          </CardTitle>
          <CardDescription>
            {modeLabel} review based on activity recorded through {formatDate(insights.referenceDate)}.
          </CardDescription>
        </CardHeader>
      </Card>

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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Consistency map</Badge>
            <CardTitle className="text-2xl" level={2}>
              How the week has filled in so far.
            </CardTitle>
            <CardDescription>Each day shows how much activity landed on that date, split between habits and tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {workspace.insights.days.map((day) => (
              <div className={`rounded-[1.35rem] border p-4 ${day.isActive ? "border-primary/18 bg-primary/8" : "border-white/10 bg-white/[0.04]"}`} key={day.date}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted/80">{day.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{day.total}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{day.habitCount} habits, {day.taskCount} tasks</p>
                {day.isToday ? <Badge className="mt-3" variant="primary">Today</Badge> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Reflection</Badge>
            <CardTitle className="text-2xl" level={2}>
              Save the week in one place.
            </CardTitle>
            <CardDescription>Reflection notes stay optional. Saving without a note still records the review snapshot for this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status}
            {reviewForm}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="success">Wins</Badge>
            <CardTitle className="flex items-center gap-2 text-2xl" level={2}>
              <Trophy className="size-5 text-primary" />
              What went well
            </CardTitle>
            <CardDescription>The review surfaces the strongest signals from the week instead of leaving them buried in raw activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.wins.map((item) => (
              <div className="rounded-[1.35rem] border border-primary/16 bg-primary/8 p-4 text-sm leading-6 text-foreground/90" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Missed areas</Badge>
            <CardTitle className="text-2xl" level={2}>
              What still needs attention
            </CardTitle>
            <CardDescription>The goal is not judgment. The page just makes weak spots explicit enough to adjust next week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.missedAreas.map((item) => (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted" key={item}>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Recent activity</Badge>
            <CardTitle className="text-2xl" level={2}>
              What drove this review
            </CardTitle>
            <CardDescription>The review stays grounded in the actual events recorded this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.recentActivity.length === 0 ? (
              <PlannerEmptyState>No activity has been recorded this week yet. The review will become more useful after the first few habit or task completions land.</PlannerEmptyState>
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
                    <p className="text-xs leading-5 text-muted/75">{formatDate(entry.completionDate)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Review history</Badge>
            <CardTitle className="text-2xl" level={2}>
              Saved snapshots
            </CardTitle>
            <CardDescription>Stored reviews stay visible here so reflection notes remain retrievable instead of disappearing after save.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReviews.length === 0 ? (
              <PlannerEmptyState>This will fill in after the first weekly review is saved.</PlannerEmptyState>
            ) : (
              recentReviews.map((review) => (
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4" key={review.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatDate(review.weekStart)} to {formatDate(review.weekEnd)}</p>
                      <p className="text-xs leading-5 text-muted/75">Saved {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(review.updatedAt))}</p>
                    </div>
                    <Badge variant="muted">{review.summarySnapshot.totalCompletions} actions</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {review.reflection?.trim() ? review.reflection : "No reflection note was saved for this review."}
                  </p>
                </div>
              ))
            )}
            <Button asChild fullWidth variant="secondary">
              <Link href={ROUTES.planner}>
                Return to planner
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
