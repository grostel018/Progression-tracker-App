"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ZodError } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localGoalProgressService } from "@/features/local-mode/progress-storage";
import {
  GoalActivityCalendar
} from "@/features/planning/components/goal-activity-calendar";
import {
  PlannerEmptyState,
  PlannerFieldError,
  PlannerFieldHint,
  PlannerFieldLabel,
  PlannerInlineStatus
} from "@/features/planning/components/planner-feedback";
import { PlannerSectionCard } from "@/features/planning/components/planner-section-card";
import { PlannerSubmitButton } from "@/features/planning/components/planner-submit-button";
import { PlanningInputError } from "@/features/planning/errors";
import {
  buildGoalProgressSummary,
  formatGoalProgressValue,
  getGoalProgressInputMeta,
  getGoalProgressPercent,
  type GoalProgressRange
} from "@/features/planning/goal-progress";
import { cn } from "@/lib/utils";
import type { GoalRecord, PlanningSnapshot } from "@/types/planning";

type SectionState = {
  message?: string;
  variant?: "success" | "error";
  fieldErrors?: Record<string, string>;
};

type GoalWorkspaceTab = "progress" | "tasks" | "habits";

type GoalLogFormValues = {
  id: string;
  goalId: string;
  loggedAt: string;
  progressValue: string;
  note: string;
};

const RANGE_OPTIONS: Array<{ label: string; value: GoalProgressRange }> = [
  { label: "Week", value: "WEEK" },
  { label: "Month", value: "MONTH" },
  { label: "Quarter", value: "QUARTER" },
  { label: "Year", value: "YEAR" }
];

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function createDefaultLogForm(goal: GoalRecord | null): GoalLogFormValues {
  return {
    id: "",
    goalId: goal?.id ?? "",
    loggedAt: new Date().toISOString().slice(0, 10),
    progressValue: goal ? String(goal.currentValue) : "0",
    note: ""
  };
}

function toDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function LocalGoalProgressSection({
  snapshot,
  onSnapshotChange
}: {
  snapshot: PlanningSnapshot;
  onSnapshotChange: (snapshot: PlanningSnapshot) => void;
}): JSX.Element {
  const availableGoals = useMemo(() => snapshot.goals.filter((goal) => goal.status !== "ARCHIVED"), [snapshot.goals]);
  const [selectedGoalId, setSelectedGoalId] = useState(availableGoals[0]?.id ?? "");
  const [range, setRange] = useState<GoalProgressRange>("MONTH");
  const [activeTab, setActiveTab] = useState<GoalWorkspaceTab>("progress");
  const [isLogComposerOpen, setIsLogComposerOpen] = useState(false);
  const [logForm, setLogForm] = useState<GoalLogFormValues>(() => createDefaultLogForm(availableGoals[0] ?? null));
  const [logState, setLogState] = useState<SectionState>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!availableGoals.length) {
      setSelectedGoalId("");
      setLogForm(createDefaultLogForm(null));
      return;
    }

    if (!availableGoals.some((goal) => goal.id === selectedGoalId)) {
      setSelectedGoalId(availableGoals[0].id);
    }
  }, [availableGoals, selectedGoalId]);

  const selectedGoal = useMemo(
    () => availableGoals.find((goal) => goal.id === selectedGoalId) ?? availableGoals[0] ?? null,
    [availableGoals, selectedGoalId]
  );
  const summary = useMemo(
    () => (selectedGoal ? buildGoalProgressSummary(snapshot, selectedGoal.id, range) : null),
    [range, selectedGoal, snapshot]
  );
  const inputMeta = selectedGoal ? getGoalProgressInputMeta(selectedGoal) : null;
  const linkedTasks = useMemo(
    () => snapshot.tasks.filter((task) => task.goalId === selectedGoal?.id && task.status !== "ARCHIVED"),
    [selectedGoal?.id, snapshot.tasks]
  );
  const linkedHabits = useMemo(
    () => snapshot.habits.filter((habit) => habit.goalId === selectedGoal?.id && habit.status !== "ARCHIVED"),
    [selectedGoal?.id, snapshot.habits]
  );

  useEffect(() => {
    if (!selectedGoal) {
      return;
    }

    setLogForm((current) => {
      if (current.id) {
        return current;
      }

      return createDefaultLogForm(selectedGoal);
    });
  }, [selectedGoal]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedGoal) {
      return;
    }

    setIsSaving(true);
    setLogState({});

    try {
      const nextSnapshot = await localGoalProgressService.saveGoalLog({
        ...(logForm.id ? { id: logForm.id } : {}),
        goalId: selectedGoal.id,
        loggedAt: logForm.loggedAt,
        progressValue: Number(logForm.progressValue),
        note: logForm.note
      });

      onSnapshotChange(nextSnapshot);
      const nextGoal = nextSnapshot.goals.find((goal) => goal.id === selectedGoal.id) ?? selectedGoal;
      setLogForm(createDefaultLogForm(nextGoal));
      setLogState({ variant: "success", message: logForm.id ? "Progress entry saved on this device." : "Progress entry added on this device." });
    } catch (error) {
      if (error instanceof ZodError) {
        setLogState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setLogState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setLogState({ variant: "error", message: "Could not save that progress entry locally." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(goalLogId: string): Promise<void> {
    if (!selectedGoal) {
      return;
    }

    setLogState({});

    try {
      const nextSnapshot = await localGoalProgressService.deleteGoalLog({
        id: goalLogId,
        goalId: selectedGoal.id
      });
      onSnapshotChange(nextSnapshot);
      const nextGoal = nextSnapshot.goals.find((goal) => goal.id === selectedGoal.id) ?? selectedGoal;
      setLogForm(createDefaultLogForm(nextGoal));
      setLogState({ variant: "success", message: "Progress entry removed from this device." });
    } catch (error) {
      if (error instanceof PlanningInputError) {
        setLogState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setLogState({ variant: "error", message: "Could not remove that progress entry locally." });
      }
    }
  }

  return (
    <PlannerSectionCard
      className="xl:col-span-2"
      description="Keep one goal in focus with a cleaner local review lane for manual logs, linked actions, and range-based history."
      kicker="Goal review"
      sectionId="goal-progress"
      title="Selected goal review"
      headerSlot={
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => setRange(option.value)}
              size="sm"
              type="button"
              variant={range === option.value ? "secondary" : "ghost"}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
    >
      {!availableGoals.length ? (
        <PlannerEmptyState>Create a goal first, then this local review surface will unlock monthly tracking, manual progress logs, and linked action history on this browser.</PlannerEmptyState>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Goal list</p>
            <div className="space-y-2">
              {availableGoals.map((goal) => {
                const isActive = goal.id === selectedGoal?.id;
                return (
                  <button
                    className={cn(
                      "w-full rounded-[1.35rem] border px-4 py-3 text-left transition-all",
                      isActive
                        ? "border-primary/45 bg-primary/10 shadow-[var(--shadow-soft)]"
                        : "surface-interactive border-border-subtle hover:border-border hover:bg-[var(--color-surface-muted-hover)]"
                    )}
                    key={goal.id}
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setActiveTab("progress");
                      setIsLogComposerOpen(false);
                      setLogForm(createDefaultLogForm(goal));
                    }}
                    type="button"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                        <Badge variant="muted">{getGoalProgressPercent(goal)}%</Badge>
                      </div>
                      <p className="text-xs leading-5 text-muted">
                        {goal.progressType === "TARGET_COUNT" && goal.targetValue
                          ? `${goal.currentValue}/${goal.targetValue}`
                          : formatGoalProgressValue(goal, goal.currentValue)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-5">
            {selectedGoal && summary ? (
              <>
                <div className="space-y-4 rounded-[1.8rem] border border-border-subtle bg-background-elevated/78 p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-semibold text-foreground">{selectedGoal.title}</p>
                        <Badge variant="success">{selectedGoal.status.toLowerCase()}</Badge>
                        <Badge variant="muted">{selectedGoal.progressType.toLowerCase().replace("_", " ")}</Badge>
                      </div>
                      {selectedGoal.description ? <p className="max-w-3xl text-sm leading-6 text-muted">{selectedGoal.description}</p> : null}
                    </div>
                    <div className="grid min-w-[240px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Progress</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{summary.percent}%</p>
                      </div>
                      <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Entries</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{summary.entryCount}</p>
                      </div>
                      <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Tasks</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{summary.linkedTaskCount}</p>
                      </div>
                      <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Habits</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{summary.linkedHabitCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 rounded-[1.1rem] border border-border-subtle bg-background-elevated/72 p-1">
                  {([
                    ["progress", "Progress"],
                    ["tasks", "Tasks"],
                    ["habits", "Habits"]
                  ] as const).map(([value, label]) => (
                    <Button key={value} onClick={() => setActiveTab(value)} size="sm" type="button" variant={activeTab === value ? "secondary" : "ghost"}>
                      {label}
                    </Button>
                  ))}
                </div>

                {activeTab === "progress" ? (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_360px]">
                    <div className="space-y-5 rounded-[1.6rem] border border-border-subtle bg-background-elevated/72 p-5">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Activity map</p>
                        <p className="text-sm leading-6 text-muted">A denser cell means more tracked proof on that day, combining manual progress, linked habits, and linked tasks.</p>
                      </div>
                      <GoalActivityCalendar cells={summary.calendar} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Visible events</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.filteredEvents.length}</p>
                        </div>
                        <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3">
                          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted/70">Manual logs in range</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.filteredLogs.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/72 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Manual progress</p>
                            <p className="mt-2 text-sm leading-6 text-muted">Use manual logs for the moments that need more context than a simple task completion or habit checkoff.</p>
                          </div>
                          <Button onClick={() => setIsLogComposerOpen((current) => !current)} type="button" variant="secondary">
                            {isLogComposerOpen ? "Hide log form" : "Add log"}
                          </Button>
                        </div>
                        {isLogComposerOpen ? (
                          <form aria-busy={isSaving} className="mt-5 space-y-3.5" onSubmit={(event) => void handleSubmit(event)}>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <PlannerFieldLabel htmlFor="local-goal-log-date">Log date</PlannerFieldLabel>
                                <Input id="local-goal-log-date" onChange={(event) => setLogForm((current) => ({ ...current, loggedAt: event.target.value }))} type="date" value={logForm.loggedAt} />
                                <PlannerFieldError id="local-goal-log-date-error" message={logState.fieldErrors?.loggedAt} />
                              </div>
                              <div className="space-y-2">
                                <PlannerFieldLabel htmlFor="local-goal-log-value">{inputMeta?.label ?? "Progress value"}</PlannerFieldLabel>
                                <Input id="local-goal-log-value" max={inputMeta?.max} min={inputMeta?.min} onChange={(event) => setLogForm((current) => ({ ...current, progressValue: event.target.value }))} step={inputMeta?.step ?? 1} type="number" value={logForm.progressValue} />
                                <PlannerFieldHint>{inputMeta?.helper ?? "Record the current state for this goal."}</PlannerFieldHint>
                                <PlannerFieldError id="local-goal-log-value-error" message={logState.fieldErrors?.progressValue} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <PlannerFieldLabel htmlFor="local-goal-log-note" optional>Manual note</PlannerFieldLabel>
                              <Textarea id="local-goal-log-note" onChange={(event) => setLogForm((current) => ({ ...current, note: event.target.value }))} placeholder="What changed, what worked, or what blocked you?" value={logForm.note} />
                              <PlannerFieldError id="local-goal-log-note-error" message={logState.fieldErrors?.note} />
                            </div>
                            {logState.message ? <PlannerInlineStatus variant={logState.variant === "error" ? "error" : "success"}>{logState.message}</PlannerInlineStatus> : null}
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <PlannerSubmitButton pending={isSaving}>{logForm.id ? "Save entry locally" : "Add entry locally"}</PlannerSubmitButton>
                              {logForm.id ? (
                                <Button onClick={() => setLogForm(createDefaultLogForm(selectedGoal))} type="button" variant="secondary">
                                  Cancel edit
                                </Button>
                              ) : null}
                            </div>
                          </form>
                        ) : null}
                      </div>

                      <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/72 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Recent proof</p>
                          <Badge variant="muted">{range.toLowerCase()}</Badge>
                        </div>
                        <div className="mt-4 space-y-3">
                          {summary.filteredEvents.length === 0 ? <PlannerEmptyState>No progress events in this range yet. Add a manual log or complete a linked habit or task.</PlannerEmptyState> : null}
                          {summary.filteredEvents.map((event) => {
                            const editableLog = (snapshot.goalLogs ?? []).find((log) => `goal-log-${log.id}` === event.id);

                            return (
                              <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3" key={event.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-foreground">{event.label}</p>
                                      <Badge variant={event.kind === "goal-log" ? "primary" : event.kind === "habit" ? "success" : "muted"}>{event.kind.replace("-", " ")}</Badge>
                                    </div>
                                    <p className="text-sm leading-6 text-muted">{event.detail}</p>
                                  </div>
                                  <div className="space-y-2 text-right">
                                    <p className="text-xs leading-5 text-muted/75">{event.date}</p>
                                    {editableLog ? (
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          onClick={() => {
                                            setLogForm({
                                              id: editableLog.id,
                                              goalId: editableLog.goalId,
                                              loggedAt: toDateInputValue(editableLog.loggedAt),
                                              progressValue: String(editableLog.progressValue),
                                              note: editableLog.note ?? ""
                                            });
                                            setIsLogComposerOpen(true);
                                          }}
                                          size="sm"
                                          type="button"
                                          variant="secondary"
                                        >
                                          Edit
                                        </Button>
                                        <Button onClick={() => void handleDelete(editableLog.id)} size="sm" type="button" variant="ghost">Delete</Button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "tasks" ? (
                  <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/72 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Goal tasks</p>
                        <p className="text-sm leading-6 text-muted">Keep the concrete work attached to the selected goal, then use the full tasks lane when you need broader editing.</p>
                      </div>
                      <Button asChild type="button" variant="secondary">
                        <Link href="#tasks">Open tasks lane</Link>
                      </Button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {linkedTasks.length === 0 ? <PlannerEmptyState>No linked tasks yet. Use the tasks lane to attach the next concrete step to this goal.</PlannerEmptyState> : null}
                      {linkedTasks.map((task) => (
                        <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3" key={task.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                                <Badge variant={task.status === "DONE" ? "success" : "primary"}>{task.status === "DONE" ? "Done" : "To do"}</Badge>
                              </div>
                              {task.description ? <p className="text-sm leading-6 text-muted">{task.description}</p> : null}
                            </div>
                            {task.scheduledFor ? <p className="text-xs text-muted/75">{toDateInputValue(task.scheduledFor)}</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTab === "habits" ? (
                  <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/72 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Goal habits</p>
                        <p className="text-sm leading-6 text-muted">Repeatable actions stay attached to the selected goal here, while the full habits lane still handles broader editing and checkoffs.</p>
                      </div>
                      <Button asChild type="button" variant="secondary">
                        <Link href="#habits">Open habits lane</Link>
                      </Button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {linkedHabits.length === 0 ? <PlannerEmptyState>No linked habits yet. Use the habits lane to attach the first repeating action to this goal.</PlannerEmptyState> : null}
                      {linkedHabits.map((habit) => (
                        <div className="rounded-[1.15rem] border border-border-subtle bg-background/70 px-4 py-3" key={habit.id}>
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold text-foreground">{habit.title}</p>
                            <p className="text-sm leading-6 text-muted">{habit.description?.trim() || "This repeating action is linked to the selected goal."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}
    </PlannerSectionCard>
  );
}
