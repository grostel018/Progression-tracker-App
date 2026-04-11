"use client";

import { useMemo, useState } from "react";
import { ZodError } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localPlanningService } from "@/features/local-mode/planning-storage";
import { PlanningInputError } from "@/features/planning/errors";
import { habitFrequencyEnum } from "@/features/planning/schema";
import { formatHabitFrequency, getLocalCalendarDateValue, isHabitScheduledForDate, WEEKDAY_OPTIONS } from "@/features/planning/recurrence";
import {
  PlannerEmptyState,
  PlannerFieldError,
  PlannerFieldHint,
  PlannerFieldLabel,
  PlannerInlineStatus
} from "@/features/planning/components/planner-feedback";
import { PlannerSectionCard } from "@/features/planning/components/planner-section-card";
import { PlannerSubmitButton } from "@/features/planning/components/planner-submit-button";
import type { HabitFrequency, PlanningSnapshot } from "@/types/planning";

type SectionState = {
  message?: string;
  variant?: "success" | "error";
  fieldErrors?: Record<string, string>;
};

type HabitFormValues = {
  id: string;
  title: string;
  description: string;
  goalId: string;
  frequency: HabitFrequency;
  customDays: number[];
};

type TaskFormValues = {
  id: string;
  title: string;
  description: string;
  goalId: string;
  scheduledFor: string;
};

type RecentActionEntry = {
  id: string;
  kind: "habit" | "task";
  title: string;
  completedAt: string;
  detail: string;
};

const EMPTY_HABIT_FORM: HabitFormValues = {
  id: "",
  title: "",
  description: "",
  goalId: "",
  frequency: "DAILY",
  customDays: []
};

const EMPTY_TASK_FORM: TaskFormValues = {
  id: "",
  title: "",
  description: "",
  goalId: "",
  scheduledFor: ""
};

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function formatDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function LocalActionTrackingSections({
  snapshot,
  onSnapshotChange
}: {
  snapshot: PlanningSnapshot;
  onSnapshotChange: (snapshot: PlanningSnapshot) => void;
}): JSX.Element {
  const [habitForm, setHabitForm] = useState<HabitFormValues>(EMPTY_HABIT_FORM);
  const [taskForm, setTaskForm] = useState<TaskFormValues>(EMPTY_TASK_FORM);
  const [completionDate, setCompletionDate] = useState(getLocalCalendarDateValue());
  const [showArchivedHabits, setShowArchivedHabits] = useState(false);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [habitState, setHabitState] = useState<SectionState>({});
  const [taskState, setTaskState] = useState<SectionState>({});
  const [isHabitSaving, setIsHabitSaving] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);

  const habitGoalOptions = useMemo(
    () => snapshot.goals.filter((item) => item.status !== "ARCHIVED" || item.id === habitForm.goalId),
    [habitForm.goalId, snapshot.goals]
  );
  const taskGoalOptions = useMemo(
    () => snapshot.goals.filter((item) => item.status !== "ARCHIVED" || item.id === taskForm.goalId),
    [snapshot.goals, taskForm.goalId]
  );
  const visibleHabits = useMemo(
    () => (showArchivedHabits ? snapshot.habits : snapshot.habits.filter((item) => item.status !== "ARCHIVED")),
    [showArchivedHabits, snapshot.habits]
  );
  const visibleTasks = useMemo(
    () => (showArchivedTasks ? snapshot.tasks : snapshot.tasks.filter((item) => item.status !== "ARCHIVED")),
    [showArchivedTasks, snapshot.tasks]
  );
  const recentActivity = useMemo<RecentActionEntry[]>(() => {
    const habitTitles = new Map(snapshot.habits.map((item) => [item.id, item.title]));
    const taskTitles = new Map(snapshot.tasks.map((item) => [item.id, item.title]));

    return [
      ...snapshot.habitCompletions.map((item) => ({
        id: `habit-${item.id}`,
        kind: "habit" as const,
        title: habitTitles.get(item.habitId) ?? "Habit",
        completedAt: item.completedAt,
        detail: `Logged for ${item.completedFor}`
      })),
      ...snapshot.taskCompletions.map((item) => ({
        id: `task-${item.id}`,
        kind: "task" as const,
        title: taskTitles.get(item.taskId) ?? "Task",
        completedAt: item.completedAt,
        detail: `Completed on ${formatDateInputValue(item.completedAt)}`
      }))
    ]
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
      .slice(0, 6);
  }, [snapshot.habitCompletions, snapshot.habits, snapshot.taskCompletions, snapshot.tasks]);

  function getGoalTitle(goalId?: string | null): string | null {
    return snapshot.goals.find((item) => item.id === goalId)?.title ?? null;
  }

  function toggleCustomDay(value: number): void {
    setHabitForm((current) => ({
      ...current,
      customDays: current.customDays.includes(value)
        ? current.customDays.filter((item) => item !== value)
        : [...current.customDays, value].sort((left, right) => left - right)
    }));
  }

  async function handleHabitSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsHabitSaving(true);
    setHabitState({});

    try {
      const payload = {
        title: habitForm.title,
        description: habitForm.description,
        goalId: habitForm.goalId,
        frequency: habitFrequencyEnum.parse(habitForm.frequency),
        customDays: habitForm.customDays
      };

      const nextSnapshot = habitForm.id
        ? await localPlanningService.updateHabit({ id: habitForm.id, ...payload })
        : await localPlanningService.saveHabit(payload);

      onSnapshotChange(nextSnapshot);
      setHabitForm(EMPTY_HABIT_FORM);
      setHabitState({ variant: "success", message: habitForm.id ? "Habit saved on this device." : "Habit added on this device." });
    } catch (error) {
      if (error instanceof ZodError) {
        setHabitState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setHabitState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setHabitState({ variant: "error", message: "Could not save that habit locally." });
      }
    } finally {
      setIsHabitSaving(false);
    }
  }

  async function handleHabitArchive(id: string): Promise<void> {
    setHabitState({});

    try {
      const nextSnapshot = await localPlanningService.archiveHabit(id);
      onSnapshotChange(nextSnapshot);
      if (habitForm.id === id) {
        setHabitForm(EMPTY_HABIT_FORM);
      }
      setHabitState({ variant: "success", message: "Habit archived on this device." });
    } catch {
      setHabitState({ variant: "error", message: "Could not archive that habit locally." });
    }
  }

  async function handleHabitCompletion(habitId: string, shouldRemove: boolean): Promise<void> {
    setHabitState({});

    try {
      const nextSnapshot = shouldRemove
        ? await localPlanningService.removeHabitCompletion({ habitId, completedFor: completionDate })
        : await localPlanningService.completeHabit({ habitId, completedFor: completionDate });
      onSnapshotChange(nextSnapshot);
      setHabitState({ variant: "success", message: shouldRemove ? "Habit completion removed from this device." : "Habit completion recorded on this device." });
    } catch (error) {
      if (error instanceof ZodError) {
        setHabitState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setHabitState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setHabitState({ variant: "error", message: "Could not update that habit completion locally." });
      }
    }
  }

  async function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsTaskSaving(true);
    setTaskState({});

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        goalId: taskForm.goalId,
        scheduledFor: taskForm.scheduledFor
      };
      const nextSnapshot = taskForm.id
        ? await localPlanningService.updateTask({ id: taskForm.id, ...payload })
        : await localPlanningService.saveTask(payload);

      onSnapshotChange(nextSnapshot);
      setTaskForm(EMPTY_TASK_FORM);
      setTaskState({ variant: "success", message: taskForm.id ? "Task saved on this device." : "Task added on this device." });
    } catch (error) {
      if (error instanceof ZodError) {
        setTaskState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setTaskState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setTaskState({ variant: "error", message: "Could not save that task locally." });
      }
    } finally {
      setIsTaskSaving(false);
    }
  }

  async function handleTaskArchive(id: string): Promise<void> {
    setTaskState({});

    try {
      const nextSnapshot = await localPlanningService.archiveTask(id);
      onSnapshotChange(nextSnapshot);
      if (taskForm.id === id) {
        setTaskForm(EMPTY_TASK_FORM);
      }
      setTaskState({ variant: "success", message: "Task archived on this device." });
    } catch {
      setTaskState({ variant: "error", message: "Could not archive that task locally." });
    }
  }

  async function handleTaskComplete(taskId: string): Promise<void> {
    setTaskState({});

    try {
      const nextSnapshot = await localPlanningService.completeTask({ taskId });
      onSnapshotChange(nextSnapshot);
      setTaskState({ variant: "success", message: "Task completed on this device." });
    } catch (error) {
      if (error instanceof ZodError) {
        setTaskState({ variant: "error", message: "Fix the highlighted field.", fieldErrors: flattenFieldErrors(error) });
      } else if (error instanceof PlanningInputError) {
        setTaskState({ variant: "error", message: error.message, fieldErrors: error.fieldErrors });
      } else {
        setTaskState({ variant: "error", message: "Could not complete that task locally." });
      }
    }
  }

  return (
    <>
      <PlannerSectionCard
        className="xl:col-span-2"
        description="Device-side action tracking is now visible instead of hidden. The local planner keeps completion records for habits and tasks so later migration and dashboard work can build on real history."
        kicker="Action history"
        sectionId="action-history"
        title="This browser now holds the daily actions behind the plan."
      >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm leading-6 text-muted">Local mode no longer stops at storing planner entities. Habit checkoffs and task finishes are persisted here too, using the same shape the cloud planner exposes.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.15rem] border border-white/10 bg-background/40 px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted/70">Habit completions</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.habitCompletions.length}</p>
                </div>
                <div className="rounded-[1.15rem] border border-white/10 bg-background/40 px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted/70">Task completions</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.taskCompletions.length}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Recent activity</p>
              {recentActivity.length === 0 ? <PlannerEmptyState>Complete a habit or a task locally and the newest activity will appear here.</PlannerEmptyState> : null}
              {recentActivity.map((entry) => (
                <div className="rounded-[1.15rem] border border-white/10 bg-background/40 px-4 py-3" key={entry.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                        <Badge variant={entry.kind === "habit" ? "primary" : "success"}>{entry.kind === "habit" ? "Habit" : "Task"}</Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted">{entry.detail}</p>
                    </div>
                    <p className="text-xs leading-5 text-muted/75">Recorded {formatDateInputValue(entry.completedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>      </PlannerSectionCard>

      <PlannerSectionCard description="Repeatable actions that support a goal when needed, but can also exist as their own rhythm." kicker="Habits" sectionId="habits" title="Define the actions you want to repeat and mark them off day by day.">
        <form aria-busy={isHabitSaving} className="space-y-3.5" onSubmit={(event) => void handleHabitSubmit(event)}>
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="local-habit-title">Habit title</PlannerFieldLabel>
            <Input aria-describedby={habitState.fieldErrors?.title ? "local-habit-title-error" : undefined} aria-invalid={habitState.fieldErrors?.title ? true : undefined} id="local-habit-title" onChange={(event) => setHabitForm((current) => ({ ...current, title: event.target.value }))} placeholder="Workout" required value={habitForm.title} />
            <PlannerFieldError id="local-habit-title-error" message={habitState.fieldErrors?.title} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-habit-goal" optional>Linked goal</PlannerFieldLabel>
              <Select id="local-habit-goal" onChange={(event) => setHabitForm((current) => ({ ...current, goalId: event.target.value }))} value={habitForm.goalId}>
                <option value="">No linked goal yet</option>
                {habitGoalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}{goal.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="local-habit-goal-error" message={habitState.fieldErrors?.goalId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-habit-frequency">Frequency</PlannerFieldLabel>
              <Select id="local-habit-frequency" onChange={(event) => setHabitForm((current) => ({ ...current, frequency: event.target.value as HabitFrequency, customDays: event.target.value === "CUSTOM" ? current.customDays : [] }))} value={habitForm.frequency}>
                <option value="DAILY">Daily</option>
                <option value="WEEKDAYS">Weekdays</option>
                <option value="WEEKLY">Weekly (Mondays)</option>
                <option value="CUSTOM">Custom days</option>
              </Select>
            </div>
          </div>

          {habitForm.frequency === "CUSTOM" ? (
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-habit-custom-days">Custom days</PlannerFieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKDAY_OPTIONS.map((option) => (
                  <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted" key={option.value}>
                    <input checked={habitForm.customDays.includes(option.value)} onChange={() => toggleCustomDay(option.value)} type="checkbox" value={option.value} />
                    <span>{option.longLabel}</span>
                  </label>
                ))}
              </div>
              <PlannerFieldError id="local-habit-custom-days-error" message={habitState.fieldErrors?.customDays} />
            </div>
          ) : null}

          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="local-habit-description" optional>Context</PlannerFieldLabel>
            <Textarea aria-describedby={habitState.fieldErrors?.description ? "local-habit-description-error" : undefined} aria-invalid={habitState.fieldErrors?.description ? true : undefined} id="local-habit-description" onChange={(event) => setHabitForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={habitForm.description} />
            <PlannerFieldError id="local-habit-description-error" message={habitState.fieldErrors?.description} />
          </div>

          {habitState.message ? <PlannerInlineStatus variant={habitState.variant === "error" ? "error" : "success"}>{habitState.message}</PlannerInlineStatus> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <PlannerSubmitButton pending={isHabitSaving}>{habitForm.id ? "Save habit locally" : "Add habit locally"}</PlannerSubmitButton>
            {habitForm.id ? (
              <Button fullWidth onClick={() => setHabitForm(EMPTY_HABIT_FORM)} type="button" variant="secondary">
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <div className="space-y-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
            <PlannerFieldLabel htmlFor="local-habit-completion-date">Track completions for</PlannerFieldLabel>
            <Input id="local-habit-completion-date" onChange={(event) => setCompletionDate(event.target.value || getLocalCalendarDateValue())} type="date" value={completionDate} />
            <PlannerFieldHint>Everything here stays on this browser, including the habit completion history for the day you choose.</PlannerFieldHint>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Stored habits</p>
            <Button onClick={() => setShowArchivedHabits((current) => !current)} size="sm" type="button" variant="ghost">
              {showArchivedHabits ? "Hide archived" : "Show archived"}
            </Button>
          </div>
          {visibleHabits.length === 0 ? <PlannerEmptyState>No habits yet. Add the action you want to repeat most consistently.</PlannerEmptyState> : null}
          {visibleHabits.map((habit) => {
            const isDue = isHabitScheduledForDate(habit, completionDate);
            const completion = snapshot.habitCompletions.find((item) => item.habitId === habit.id && item.completedFor === completionDate);

            return (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.06]" key={habit.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{habit.title}</p>
                      {habit.status === "ARCHIVED" ? <Badge variant="warning">Archived</Badge> : null}
                      <Badge variant={completion ? "success" : isDue ? "primary" : "muted"}>{completion ? "Done for selected day" : isDue ? "Scheduled" : "Not scheduled"}</Badge>
                      {habit.goalId ? <Badge variant="muted">{getGoalTitle(habit.goalId)}</Badge> : null}
                    </div>
                    <p className="text-sm leading-6 text-muted">{formatHabitFrequency(habit)}</p>
                    {habit.description ? <p className="text-sm leading-6 text-muted/80">{habit.description}</p> : null}
                    {completion ? <p className="text-xs leading-5 text-muted/75">Completed on {completion.completedFor}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setHabitForm({ id: habit.id, title: habit.title, description: habit.description ?? "", goalId: habit.goalId ?? "", frequency: habit.frequency, customDays: habit.customDays ?? [] })} size="sm" type="button" variant="secondary">
                      Edit
                    </Button>
                    {habit.status !== "ARCHIVED" ? (
                      <Button onClick={() => void handleHabitCompletion(habit.id, Boolean(completion))} size="sm" type="button" variant={completion ? "ghost" : "subtle"} disabled={!completion && !isDue}>
                        {completion ? "Undo day" : "Mark done"}
                      </Button>
                    ) : null}
                    {habit.status !== "ARCHIVED" ? (
                      <Button onClick={() => void handleHabitArchive(habit.id)} size="sm" type="button" variant="ghost">Archive</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PlannerSectionCard>

      <PlannerSectionCard description="Specific concrete actions that can optionally support a goal without forcing a deep hierarchy." kicker="Tasks" sectionId="tasks" title="Capture the next action, then mark it complete when it is truly done.">
        <form aria-busy={isTaskSaving} className="space-y-3.5" onSubmit={(event) => void handleTaskSubmit(event)}>
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="local-task-title">Task title</PlannerFieldLabel>
            <Input aria-describedby={taskState.fieldErrors?.title ? "local-task-title-error" : undefined} aria-invalid={taskState.fieldErrors?.title ? true : undefined} id="local-task-title" onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Drink 2.5L of water" required value={taskForm.title} />
            <PlannerFieldError id="local-task-title-error" message={taskState.fieldErrors?.title} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-task-goal" optional>Linked goal</PlannerFieldLabel>
              <Select id="local-task-goal" onChange={(event) => setTaskForm((current) => ({ ...current, goalId: event.target.value }))} value={taskForm.goalId}>
                <option value="">No linked goal yet</option>
                {taskGoalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}{goal.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="local-task-goal-error" message={taskState.fieldErrors?.goalId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="local-task-scheduled-for" optional>Schedule it</PlannerFieldLabel>
              <Input aria-describedby={taskState.fieldErrors?.scheduledFor ? "local-task-scheduled-for-error" : undefined} aria-invalid={taskState.fieldErrors?.scheduledFor ? true : undefined} id="local-task-scheduled-for" onChange={(event) => setTaskForm((current) => ({ ...current, scheduledFor: event.target.value }))} type="date" value={taskForm.scheduledFor} />
              <PlannerFieldHint>Pick the day first. Time-specific scheduling can come later.</PlannerFieldHint>
              <PlannerFieldError id="local-task-scheduled-for-error" message={taskState.fieldErrors?.scheduledFor} />
            </div>
          </div>

          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="local-task-description" optional>Context</PlannerFieldLabel>
            <Textarea aria-describedby={taskState.fieldErrors?.description ? "local-task-description-error" : undefined} aria-invalid={taskState.fieldErrors?.description ? true : undefined} id="local-task-description" onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={taskForm.description} />
            <PlannerFieldError id="local-task-description-error" message={taskState.fieldErrors?.description} />
          </div>

          {taskState.message ? <PlannerInlineStatus variant={taskState.variant === "error" ? "error" : "success"}>{taskState.message}</PlannerInlineStatus> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <PlannerSubmitButton pending={isTaskSaving}>{taskForm.id ? "Save task locally" : "Add task locally"}</PlannerSubmitButton>
            {taskForm.id ? (
              <Button fullWidth onClick={() => setTaskForm(EMPTY_TASK_FORM)} type="button" variant="secondary">
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted/70">Stored tasks</p>
            <Button onClick={() => setShowArchivedTasks((current) => !current)} size="sm" type="button" variant="ghost">
              {showArchivedTasks ? "Hide archived" : "Show archived"}
            </Button>
          </div>
          {visibleTasks.length === 0 ? <PlannerEmptyState>No tasks yet. Add the next concrete action that moves you forward.</PlannerEmptyState> : null}
          {visibleTasks.map((task) => (
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/25 hover:bg-white/[0.06]" key={task.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground">{task.title}</p>
                    <Badge variant={task.status === "ARCHIVED" ? "warning" : task.status === "DONE" ? "success" : "primary"}>{task.status === "ARCHIVED" ? "Archived" : task.status === "DONE" ? "Done" : "To do"}</Badge>
                    {task.goalId ? <Badge variant="muted">{getGoalTitle(task.goalId)}</Badge> : null}
                  </div>
                  {task.description ? <p className="text-sm leading-6 text-muted/80">{task.description}</p> : null}
                  {task.scheduledFor ? <p className="text-xs leading-5 text-muted/75">Scheduled for {formatDateInputValue(task.scheduledFor)}</p> : null}
                  {task.completedAt ? <p className="text-xs leading-5 text-muted/75">Completed on {formatDateInputValue(task.completedAt)}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setTaskForm({ id: task.id, title: task.title, description: task.description ?? "", goalId: task.goalId ?? "", scheduledFor: formatDateInputValue(task.scheduledFor) })} size="sm" type="button" variant="secondary">
                    Edit
                  </Button>
                  {task.status === "TODO" ? (
                    <Button onClick={() => void handleTaskComplete(task.id)} size="sm" type="button" variant="subtle">Complete</Button>
                  ) : null}
                  {task.status !== "ARCHIVED" ? (
                    <Button onClick={() => void handleTaskArchive(task.id)} size="sm" type="button" variant="ghost">Archive</Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PlannerSectionCard>
    </>
  );
}



