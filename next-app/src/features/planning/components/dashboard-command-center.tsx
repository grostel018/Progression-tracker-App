"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Compass, Flame, Goal, ListChecks, Repeat, Sparkles, Star, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { GoalActivityCalendar } from "@/features/planning/components/goal-activity-calendar";
import { buildPlanningActivityInsights } from "@/features/planning/insights";
import type { PlanningSnapshot } from "@/types/planning";

type DashboardCommandCenterProps = {
  snapshot: PlanningSnapshot;
  isLocalMode: boolean;
};

type DashboardRange = "WEEK" | "MONTH" | "YEAR";

type DashboardEvent = {
  id: string;
  kind: "goal-log" | "habit" | "task";
  title: string;
  detail: string;
  date: string;
};

type MetricCard = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
};

type PulseCard = {
  label: string;
  value: number;
  icon: LucideIcon;
};

const RANGE_DAYS: Record<DashboardRange, number> = {
  WEEK: 7,
  MONTH: 30,
  YEAR: 365
};

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function shiftDate(dateKey: string, deltaDays: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return toDateKey(date.toISOString());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildDashboardEvents(snapshot: PlanningSnapshot): DashboardEvent[] {
  const habitsById = new Map(snapshot.habits.map((habit) => [habit.id, habit]));
  const tasksById = new Map(snapshot.tasks.map((task) => [task.id, task]));

  return [
    ...(snapshot.goalLogs ?? []).map((log) => ({
      id: `goal-log-${log.id}`,
      kind: "goal-log" as const,
      title: "Manual progress",
      detail: log.note?.trim() ? log.note : `Logged ${log.progressValue}`,
      date: toDateKey(log.loggedAt)
    })),
    ...snapshot.habitCompletions.map((completion) => ({
      id: `habit-${completion.id}`,
      kind: "habit" as const,
      title: habitsById.get(completion.habitId)?.title ?? "Habit",
      detail: `Checked off for ${completion.completedFor}`,
      date: completion.completedFor
    })),
    ...snapshot.taskCompletions.map((completion) => ({
      id: `task-${completion.id}`,
      kind: "task" as const,
      title: tasksById.get(completion.taskId)?.title ?? "Task",
      detail: `Completed on ${toDateKey(completion.completedAt)}`,
      date: toDateKey(completion.completedAt)
    }))
  ].sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
}

function buildCalendar(events: DashboardEvent[], range: DashboardRange, referenceDate: string) {
  const days = RANGE_DAYS[range];
  const startDate = shiftDate(referenceDate, -(days - 1));
  const filtered = events.filter((event) => event.date >= startDate && event.date <= referenceDate);
  const cells = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(startDate, index);
    return {
      date,
      count: filtered.filter((event) => event.date === date).length
    };
  });

  return {
    filtered,
    cells,
    activeDays: cells.filter((cell) => cell.count > 0).length
  };
}

function MetricTile({ card }: { card: MetricCard }): JSX.Element {
  const Icon = card.icon;

  return (
    <div className="rounded-2xl border border-border-subtle bg-background-elevated/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted/75">{card.label}</p>
          <p className="text-4xl font-semibold leading-none text-foreground tabular-nums">{card.value}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{card.detail}</p>
    </div>
  );
}

function PulseRow({ card }: { card: PulseCard }): JSX.Element {
  const Icon = card.icon;

  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] text-primary">
          <Icon className="size-4" />
        </span>
        <p className="truncate text-sm font-medium text-foreground">{card.label}</p>
      </div>
      <p className="text-2xl font-semibold leading-none text-foreground tabular-nums">{card.value}</p>
    </div>
  );
}

function SummaryList({ emptyText, items }: { emptyText: string; items: { id: string; title: string; body: string }[] }): JSX.Element {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-border-subtle bg-[var(--color-surface-muted)]/40 px-4 py-5 text-sm leading-6 text-muted">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-background/45">
      {items.map((item) => (
        <div className="p-4" key={item.id}>
          <p className="font-medium text-foreground">{item.title}</p>
          <p className="mt-1.5 text-sm leading-6 text-muted">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardCommandCenter({ snapshot, isLocalMode }: DashboardCommandCenterProps): JSX.Element {
  const [range, setRange] = useState<DashboardRange>("YEAR");
  const insights = useMemo(() => buildPlanningActivityInsights(snapshot), [snapshot]);
  const events = useMemo(() => buildDashboardEvents(snapshot), [snapshot]);
  const history = useMemo(() => buildCalendar(events, range, insights.referenceDate), [events, insights.referenceDate, range]);
  const activeGoals = useMemo(() => snapshot.goals.filter((goal) => goal.status === "ACTIVE"), [snapshot.goals]);
  const completedGoals = useMemo(() => snapshot.goals.filter((goal) => goal.status === "COMPLETED"), [snapshot.goals]);
  const completedDreams = useMemo(() => snapshot.dreams.filter((dream) => dream.status === "COMPLETED"), [snapshot.dreams]);
  const achievements = completedGoals.length + completedDreams.length + (insights.currentStreakDays >= 7 ? 1 : 0) + ((snapshot.goalLogs?.length ?? 0) > 0 ? 1 : 0);
  const goalSummary = activeGoals.slice(0, 3).map((goal) => ({
    id: goal.id,
    title: goal.title,
    body: goal.description?.trim() || "This goal is live and ready for attached tasks, habits, and manual progress logs."
  }));
  const dreamSummary = snapshot.dreams
    .filter((dream) => dream.status !== "ARCHIVED")
    .slice(0, 3)
    .map((dream) => ({
      id: dream.id,
      title: dream.title,
      body: dream.vision?.trim() || dream.description?.trim() || "This direction is waiting for clearer goal and action scaffolding."
    }));
  const recentGroups = useMemo(
    () => [
      {
        label: "Manual logs",
        items: events.filter((event) => event.kind === "goal-log").slice(0, 3)
      },
      {
        label: "Habit actions",
        items: events.filter((event) => event.kind === "habit").slice(0, 3)
      },
      {
        label: "Task completions",
        items: events.filter((event) => event.kind === "task").slice(0, 3)
      }
    ],
    [events]
  );

  const statCards: MetricCard[] = [
    {
      label: "Dreams",
      value: snapshot.dreams.filter((dream) => dream.status !== "ARCHIVED").length,
      detail: snapshot.dreams.length ? "Long-range direction is defined." : "No dreams yet.",
      icon: Compass
    },
    {
      label: "Active goals",
      value: activeGoals.length,
      detail: activeGoals.length ? "Targets currently in motion." : "No live goals yet.",
      icon: Goal
    },
    {
      label: "Current streak",
      value: insights.currentStreakDays,
      detail: insights.currentStreakDays ? "Days with visible proof." : "No streak yet.",
      icon: Flame
    },
    {
      label: "Achievements",
      value: achievements,
      detail: achievements ? "Milestones converted into proof." : "No milestones yet.",
      icon: Star
    }
  ];

  const pulseCards: PulseCard[] = [
    {
      label: "Manual logs",
      value: snapshot.goalLogs?.length ?? 0,
      icon: Sparkles
    },
    {
      label: "Recorded actions",
      value: insights.totalCompletionCount,
      icon: Repeat
    },
    {
      label: "Open tasks",
      value: insights.openTaskCount,
      icon: ListChecks
    },
    {
      label: "Habits due today",
      value: insights.dueHabitsToday,
      icon: Flame
    }
  ];

  return (
    <div className="space-y-8">
      <section className="scroll-mt-28 space-y-5" id="overview">
        <Card className="bg-background-elevated/78 p-5 sm:p-7">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="eyebrow">Dashboard</p>
                  <Badge variant="muted">{isLocalMode ? "Local data" : "Cloud data"}</Badge>
                </div>
                <div className="max-w-3xl space-y-3">
                  <h1 className="text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl">Know what needs attention next.</h1>
                  <p className="text-base leading-7 text-muted">
                    A single scan of active goals, recent proof, and workspace rhythm before you decide where to work.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`${ROUTES.planner}#goals`}>
                    Open goals
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={`${ROUTES.planner}#dreams`}>Review dreams</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-background/45 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Today at a glance</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Current workspace counts.</p>
                </div>
                <span className="size-2.5 rounded-full bg-primary shadow-[0_0_0_6px_rgba(103,224,184,0.12)]" />
              </div>
              <div className="divide-y divide-border-subtle">
                {pulseCards.map((card) => (
                  <PulseRow card={card} key={card.label} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {statCards.map((card) => (
            <MetricTile card={card} key={card.label} />
          ))}
        </div>
      </section>

      <section className="scroll-mt-28 space-y-5" id="history">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border-subtle pt-7">
          <div className="max-w-3xl space-y-2">
            <p className="eyebrow">History</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">Activity rhythm</h2>
            <p className="text-sm leading-7 text-muted">Workspace-wide proof over time, grouped before you drill into a specific goal.</p>
          </div>
          <div className="flex min-h-11 flex-wrap gap-1 rounded-full border border-border-subtle bg-background-elevated/72 p-1">
            {(["WEEK", "MONTH", "YEAR"] as const).map((option) => (
              <Button
                key={option}
                onClick={() => setRange(option)}
                size="sm"
                type="button"
                variant={range === option ? "secondary" : "ghost"}
              >
                {option === "WEEK" ? "Week" : option === "MONTH" ? "Month" : "Year"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="bg-background-elevated/72 p-5 sm:p-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-tight">Activity calendar</h3>
                  <p className="text-sm leading-6 text-muted">{history.filtered.length} recorded moments across {history.activeDays} active days.</p>
                </div>
                <Badge variant="muted">{range.toLowerCase()}</Badge>
              </div>
              <GoalActivityCalendar cells={history.cells} className="pt-1" />
            </div>
          </Card>

          <Card className="bg-background-elevated/72 p-5 sm:p-6">
            <div className="space-y-3">
              <p className="eyebrow">Read first</p>
              <p className="text-xl font-semibold leading-snug text-foreground">
                {insights.currentStreakDays ? `${insights.currentStreakDays} day rhythm is still alive.` : "The workspace needs a fresh proof event."}
              </p>
              <p className="text-sm leading-6 text-muted">
                {activeGoals.length
                  ? `${activeGoals.length} active goals are live. Open the planner to tighten tasks, habits, or manual logs around one of them.`
                  : "There are no active goals right now. The cleanest next move is to define one measurable target in the planner."}
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="scroll-mt-28 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" id="summaries">
        <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Card className="bg-background-elevated/72 p-5 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="eyebrow">Goals</p>
                <h2 className="text-2xl font-semibold tracking-tight">{pluralize(activeGoals.length, "tracked goal")}</h2>
                <p className="text-sm leading-6 text-muted">
                  {activeGoals.length
                    ? `${insights.totalCompletionCount} recorded actions are feeding the active goals lane.`
                    : "No active goals yet. Open the planner and create the first measurable target."}
                </p>
              </div>
              <SummaryList emptyText="No active goals yet." items={goalSummary} />
            </div>
          </Card>

          <Card className="bg-background-elevated/72 p-5 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="eyebrow">Dreams</p>
                <h2 className="text-2xl font-semibold tracking-tight">{pluralize(snapshot.dreams.filter((dream) => dream.status !== "ARCHIVED").length, "tracked dream")}</h2>
                <p className="text-sm leading-6 text-muted">Long-range direction stays next to immediate execution.</p>
              </div>
              <SummaryList emptyText="No dreams yet." items={dreamSummary} />
            </div>
          </Card>
        </div>

        <Card className="bg-background-elevated/78 p-5 sm:p-6" id="recent-activity">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="eyebrow">Recent activity</p>
              <h2 className="text-2xl font-semibold tracking-tight">Grouped by source</h2>
              <p className="text-sm leading-6 text-muted">Manual logs, habit actions, and completed tasks stay separated for faster scanning.</p>
            </div>

            <div className="space-y-5">
              {recentGroups.map((group) => (
                <div className="space-y-2.5" key={group.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/80">{group.label}</p>
                    <Badge variant="muted">{group.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.items.length ? group.items.map((item) => (
                      <div className="rounded-xl border border-border-subtle bg-background/45 px-3.5 py-3" key={item.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                          </div>
                          <p className="shrink-0 text-xs text-muted/75">{formatDate(item.date)}</p>
                        </div>
                      </div>
                    )) : <p className="rounded-xl border border-dashed border-border-subtle bg-[var(--color-surface-muted)]/40 px-3.5 py-3 text-sm leading-6 text-muted">No entries yet.</p>}
                  </div>
                </div>
              ))}
            </div>

            <Button asChild fullWidth size="lg" variant="secondary">
              <Link href={ROUTES.weeklyReview}>
                Open weekly review
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}