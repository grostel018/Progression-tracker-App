"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveHabitAction,
  archiveTaskAction,
  completeHabitAction,
  completeTaskAction,
  removeHabitCompletionAction,
  saveHabitAction,
  saveTaskAction
} from "@/features/planning/actions/cloud";
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
import { PLANNING_ACTION_INITIAL_STATE } from "@/features/planning/types";
import type { HabitFrequency, PlanningSnapshot } from "@/types/planning";

type InlineNotice = {
  message: string;
  variant: "success" | "error";
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

function focusFirstField(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])")?.focus();
}

function formatDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function CloudActionTrackingSections({
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
  const [habitNotice, setHabitNotice] = useState<InlineNotice | null>(null);
  const [taskNotice, setTaskNotice] = useState<InlineNotice | null>(null);
  const habitFormRef = useRef<HTMLFormElement>(null);
  const taskFormRef = useRef<HTMLFormElement>(null);

  const [habitState, habitAction] = useFormState(saveHabitAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [habitArchiveState, habitArchiveAction] = useFormState(archiveHabitAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [habitCompleteState, habitCompleteAction] = useFormState(completeHabitAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [habitRemoveState, habitRemoveAction] = useFormState(removeHabitCompletionAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [taskState, taskAction] = useFormState(saveTaskAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [taskArchiveState, taskArchiveAction] = useFormState(archiveTaskAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });
  const [taskCompleteState, taskCompleteAction] = useFormState(completeTaskAction, { ...PLANNING_ACTION_INITIAL_STATE, snapshot });

  useEffect(() => {
    if (habitState.status === "success") {
      onSnapshotChange(habitState.snapshot);
      setHabitForm(EMPTY_HABIT_FORM);
      setHabitNotice({ variant: "success", message: habitState.message ?? "Habit saved." });
      focusFirstField(habitFormRef.current);
    } else if (habitState.status === "error" && habitState.message) {
      setHabitNotice({ variant: "error", message: habitState.message });
    }
  }, [habitState, onSnapshotChange]);

  useEffect(() => {
    if (habitArchiveState.status === "success") {
      onSnapshotChange(habitArchiveState.snapshot);
      setHabitNotice({ variant: "success", message: habitArchiveState.message ?? "Habit archived." });
      if (habitForm.id && habitArchiveState.snapshot.habits.find((item) => item.id === habitForm.id)?.status === "ARCHIVED") {
        setHabitForm(EMPTY_HABIT_FORM);
      }
    } else if (habitArchiveState.status === "error" && habitArchiveState.message) {
      setHabitNotice({ variant: "error", message: habitArchiveState.message });
    }
  }, [habitArchiveState, habitForm.id, onSnapshotChange]);

  useEffect(() => {
    if (habitCompleteState.status === "success") {
      onSnapshotChange(habitCompleteState.snapshot);
      setHabitNotice({ variant: "success", message: habitCompleteState.message ?? "Habit completion recorded." });
    } else if (habitCompleteState.status === "error" && habitCompleteState.message) {
      setHabitNotice({ variant: "error", message: habitCompleteState.message });
    }
  }, [habitCompleteState, onSnapshotChange]);

  useEffect(() => {
    if (habitRemoveState.status === "success") {
      onSnapshotChange(habitRemoveState.snapshot);
      setHabitNotice({ variant: "success", message: habitRemoveState.message ?? "Habit completion removed." });
    } else if (habitRemoveState.status === "error" && habitRemoveState.message) {
      setHabitNotice({ variant: "error", message: habitRemoveState.message });
    }
  }, [habitRemoveState, onSnapshotChange]);

  useEffect(() => {
    if (taskState.status === "success") {
      onSnapshotChange(taskState.snapshot);
      setTaskForm(EMPTY_TASK_FORM);
      setTaskNotice({ variant: "success", message: taskState.message ?? "Task saved." });
      focusFirstField(taskFormRef.current);
    } else if (taskState.status === "error" && taskState.message) {
      setTaskNotice({ variant: "error", message: taskState.message });
    }
  }, [taskState, onSnapshotChange]);

  useEffect(() => {
    if (taskArchiveState.status === "success") {
      onSnapshotChange(taskArchiveState.snapshot);
      setTaskNotice({ variant: "success", message: taskArchiveState.message ?? "Task archived." });
      if (taskForm.id && taskArchiveState.snapshot.tasks.find((item) => item.id === taskForm.id)?.status === "ARCHIVED") {
        setTaskForm(EMPTY_TASK_FORM);
      }
    } else if (taskArchiveState.status === "error" && taskArchiveState.message) {
      setTaskNotice({ variant: "error", message: taskArchiveState.message });
    }
  }, [taskArchiveState, taskForm.id, onSnapshotChange]);

  useEffect(() => {
    if (taskCompleteState.status === "success") {
      onSnapshotChange(taskCompleteState.snapshot);
      setTaskNotice({ variant: "success", message: taskCompleteState.message ?? "Task completed." });
    } else if (taskCompleteState.status === "error" && taskCompleteState.message) {
      setTaskNotice({ variant: "error", message: taskCompleteState.message });
    }
  }, [taskCompleteState, onSnapshotChange]);

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

  return (
    <>
      <PlannerSectionCard
        className="xl:col-span-2"
        description="Habit completions and task finishes are persisted as separate records now, so later dashboard and streak work can build on real history instead of inferred state."
        kicker="Action history"
        sectionId="action-history"
        title="Your planner now stores the daily actions behind the plan."
      >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm leading-6 text-muted">Action tracking is no longer hidden behind form submissions. The latest completions are visible here and already separated into habit and task history.</p>
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
              {recentActivity.length === 0 ? <PlannerEmptyState>Complete a habit or a task and the newest activity will appear here.</PlannerEmptyState> : null}
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
        <form action={habitAction} className="space-y-3.5" ref={habitFormRef}>
          <input name="id" type="hidden" value={habitForm.id} />
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="cloud-habit-title">Habit title</PlannerFieldLabel>
            <Input aria-describedby={habitState.fieldErrors?.title ? "cloud-habit-title-error" : undefined} aria-invalid={habitState.fieldErrors?.title ? true : undefined} id="cloud-habit-title" name="title" onChange={(event) => setHabitForm((current) => ({ ...current, title: event.target.value }))} placeholder="Workout" required value={habitForm.title} />
            <PlannerFieldError id="cloud-habit-title-error" message={habitState.fieldErrors?.title} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-habit-goal" optional>Linked goal</PlannerFieldLabel>
              <Select id="cloud-habit-goal" name="goalId" onChange={(event) => setHabitForm((current) => ({ ...current, goalId: event.target.value }))} value={habitForm.goalId}>
                <option value="">No linked goal yet</option>
                {habitGoalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}{goal.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="cloud-habit-goal-error" message={habitState.fieldErrors?.goalId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-habit-frequency">Frequency</PlannerFieldLabel>
              <Select id="cloud-habit-frequency" name="frequency" onChange={(event) => setHabitForm((current) => ({ ...current, frequency: event.target.value as HabitFrequency, customDays: event.target.value === "CUSTOM" ? current.customDays : [] }))} value={habitForm.frequency}>
                <option value="DAILY">Daily</option>
                <option value="WEEKDAYS">Weekdays</option>
                <option value="WEEKLY">Weekly (Mondays)</option>
                <option value="CUSTOM">Custom days</option>
              </Select>
            </div>
          </div>

          {habitForm.frequency === "CUSTOM" ? (
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-habit-custom-days">Custom days</PlannerFieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKDAY_OPTIONS.map((option) => (
                  <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted" key={option.value}>
                    <input checked={habitForm.customDays.includes(option.value)} name="customDays" onChange={() => toggleCustomDay(option.value)} type="checkbox" value={option.value} />
                    <span>{option.longLabel}</span>
                  </label>
                ))}
              </div>
              <PlannerFieldError id="cloud-habit-custom-days-error" message={habitState.fieldErrors?.customDays} />
            </div>
          ) : null}

          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="cloud-habit-description" optional>Context</PlannerFieldLabel>
            <Textarea aria-describedby={habitState.fieldErrors?.description ? "cloud-habit-description-error" : undefined} aria-invalid={habitState.fieldErrors?.description ? true : undefined} id="cloud-habit-description" name="description" onChange={(event) => setHabitForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={habitForm.description} />
            <PlannerFieldError id="cloud-habit-description-error" message={habitState.fieldErrors?.description} />
          </div>

          {habitNotice ? <PlannerInlineStatus variant={habitNotice.variant}>{habitNotice.message}</PlannerInlineStatus> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <PlannerSubmitButton pendingLabel={habitForm.id ? "Saving habit..." : "Adding habit..."}>{habitForm.id ? "Save habit" : "Add habit"}</PlannerSubmitButton>
            {habitForm.id ? (
              <Button fullWidth onClick={() => setHabitForm(EMPTY_HABIT_FORM)} type="button" variant="secondary">
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <div className="space-y-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
            <PlannerFieldLabel htmlFor="cloud-habit-completion-date">Track completions for</PlannerFieldLabel>
            <Input id="cloud-habit-completion-date" onChange={(event) => setCompletionDate(event.target.value || getLocalCalendarDateValue())} type="date" value={completionDate} />
            <PlannerFieldHint>Habits follow their recurrence rules for the selected day, and you can backfill a missed day here when needed.</PlannerFieldHint>
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
                      completion ? (
                        <form action={habitRemoveAction}>
                          <input name="habitId" type="hidden" value={habit.id} />
                          <input name="completedFor" type="hidden" value={completionDate} />
                          <Button size="sm" type="submit" variant="ghost">Undo day</Button>
                        </form>
                      ) : (
                        <form action={habitCompleteAction}>
                          <input name="habitId" type="hidden" value={habit.id} />
                          <input name="completedFor" type="hidden" value={completionDate} />
                          <Button disabled={!isDue} size="sm" type="submit" variant="subtle">Mark done</Button>
                        </form>
                      )
                    ) : null}
                    {habit.status !== "ARCHIVED" ? (
                      <form action={habitArchiveAction}>
                        <input name="id" type="hidden" value={habit.id} />
                        <Button size="sm" type="submit" variant="ghost">Archive</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PlannerSectionCard>

      <PlannerSectionCard description="Specific concrete actions that can optionally support a goal without forcing a deep hierarchy." kicker="Tasks" sectionId="tasks" title="Capture the next action, then mark it complete when it is truly done.">
        <form action={taskAction} className="space-y-3.5" ref={taskFormRef}>
          <input name="id" type="hidden" value={taskForm.id} />
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="cloud-task-title">Task title</PlannerFieldLabel>
            <Input aria-describedby={taskState.fieldErrors?.title ? "cloud-task-title-error" : undefined} aria-invalid={taskState.fieldErrors?.title ? true : undefined} id="cloud-task-title" name="title" onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Drink 2.5L of water" required value={taskForm.title} />
            <PlannerFieldError id="cloud-task-title-error" message={taskState.fieldErrors?.title} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-task-goal" optional>Linked goal</PlannerFieldLabel>
              <Select id="cloud-task-goal" name="goalId" onChange={(event) => setTaskForm((current) => ({ ...current, goalId: event.target.value }))} value={taskForm.goalId}>
                <option value="">No linked goal yet</option>
                {taskGoalOptions.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}{goal.status === "ARCHIVED" ? " (archived)" : ""}</option>
                ))}
              </Select>
              <PlannerFieldError id="cloud-task-goal-error" message={taskState.fieldErrors?.goalId} />
            </div>

            <div className="space-y-2">
              <PlannerFieldLabel htmlFor="cloud-task-scheduled-for" optional>Schedule it</PlannerFieldLabel>
              <Input aria-describedby={taskState.fieldErrors?.scheduledFor ? "cloud-task-scheduled-for-error" : undefined} aria-invalid={taskState.fieldErrors?.scheduledFor ? true : undefined} id="cloud-task-scheduled-for" name="scheduledFor" onChange={(event) => setTaskForm((current) => ({ ...current, scheduledFor: event.target.value }))} type="date" value={taskForm.scheduledFor} />
              <PlannerFieldHint>Pick the day first. Time-specific scheduling can come later.</PlannerFieldHint>
              <PlannerFieldError id="cloud-task-scheduled-for-error" message={taskState.fieldErrors?.scheduledFor} />
            </div>
          </div>

          <div className="space-y-2">
            <PlannerFieldLabel htmlFor="cloud-task-description" optional>Context</PlannerFieldLabel>
            <Textarea aria-describedby={taskState.fieldErrors?.description ? "cloud-task-description-error" : undefined} aria-invalid={taskState.fieldErrors?.description ? true : undefined} id="cloud-task-description" name="description" onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional context" value={taskForm.description} />
            <PlannerFieldError id="cloud-task-description-error" message={taskState.fieldErrors?.description} />
          </div>

          {taskNotice ? <PlannerInlineStatus variant={taskNotice.variant}>{taskNotice.message}</PlannerInlineStatus> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <PlannerSubmitButton pendingLabel={taskForm.id ? "Saving task..." : "Adding task..."}>{taskForm.id ? "Save task" : "Add task"}</PlannerSubmitButton>
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
                    <form action={taskCompleteAction}>
                      <input name="taskId" type="hidden" value={task.id} />
                      <Button size="sm" type="submit" variant="subtle">Complete</Button>
                    </form>
                  ) : null}
                  {task.status !== "ARCHIVED" ? (
                    <form action={taskArchiveAction}>
                      <input name="id" type="hidden" value={task.id} />
                      <Button size="sm" type="submit" variant="ghost">Archive</Button>
                    </form>
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



