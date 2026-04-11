import type { GoalLogRecord, GoalProgressType, GoalRecord, PlanningSnapshot } from "@/types/planning";

export type GoalProgressRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export type GoalActivityKind = "goal-log" | "habit" | "task";

export type GoalActivityEvent = {
  id: string;
  kind: GoalActivityKind;
  date: string;
  label: string;
  detail: string;
};

export type GoalProgressSummary = {
  goal: GoalRecord;
  percent: number;
  entryCount: number;
  linkedHabitCount: number;
  linkedTaskCount: number;
  filteredLogs: GoalLogRecord[];
  filteredEvents: GoalActivityEvent[];
  calendar: Array<{ date: string; count: number }>;
};

const RANGE_DAYS: Record<GoalProgressRange, number> = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
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

export function getGoalProgressPercent(goal: GoalRecord): number {
  if (goal.progressType === "BINARY") {
    return goal.currentValue > 0 ? 100 : 0;
  }

  if (goal.progressType === "PERCENT") {
    return Math.max(0, Math.min(100, goal.currentValue));
  }

  if (!goal.targetValue || goal.targetValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)));
}

export function formatGoalProgressValue(goal: GoalRecord, value: number): string {
  if (goal.progressType === "BINARY") {
    return value > 0 ? "Complete" : "Not complete";
  }

  if (goal.progressType === "PERCENT") {
    return `${value}%`;
  }

  if (goal.targetValue) {
    return `${value}/${goal.targetValue}`;
  }

  return String(value);
}

export function getGoalProgressInputMeta(goal: GoalRecord): {
  label: string;
  min: number;
  max?: number;
  step: number;
  helper: string;
} {
  if (goal.progressType === "BINARY") {
    return {
      label: "Completion value",
      min: 0,
      max: 1,
      step: 1,
      helper: "Use 0 for not complete or 1 for complete."
    };
  }

  if (goal.progressType === "PERCENT") {
    return {
      label: "Progress percent",
      min: 0,
      max: 100,
      step: 1,
      helper: "Record a percent between 0 and 100."
    };
  }

  return {
    label: "Current count",
    min: 0,
    step: 1,
    helper: goal.targetValue ? `Track current count against the target of ${goal.targetValue}.` : "Track the current count for this goal."
  };
}

export function buildGoalProgressSummary(
  snapshot: PlanningSnapshot,
  goalId: string,
  range: GoalProgressRange,
  referenceDate: string = toDateKey(new Date().toISOString())
): GoalProgressSummary | null {
  const goal = snapshot.goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  const linkedHabits = snapshot.habits.filter((habit) => habit.goalId === goal.id && habit.status !== "ARCHIVED");
  const linkedTasks = snapshot.tasks.filter((task) => task.goalId === goal.id && task.status !== "ARCHIVED");
  const linkedHabitIds = new Set(linkedHabits.map((habit) => habit.id));
  const linkedTaskIds = new Set(linkedTasks.map((task) => task.id));
  const days = RANGE_DAYS[range];
  const startDate = shiftDate(referenceDate, -(days - 1));
  const goalLogs = (snapshot.goalLogs ?? [])
    .filter((log) => log.goalId === goal.id)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
  const filteredLogs = goalLogs.filter((log) => {
    const dateKey = toDateKey(log.loggedAt);
    return dateKey >= startDate && dateKey <= referenceDate;
  });

  const filteredEvents: GoalActivityEvent[] = [
    ...filteredLogs.map((log) => ({
      id: `goal-log-${log.id}`,
      kind: "goal-log" as const,
      date: toDateKey(log.loggedAt),
      label: "Manual progress",
      detail: log.note?.trim() ? `${formatGoalProgressValue(goal, log.progressValue)} • ${log.note}` : formatGoalProgressValue(goal, log.progressValue)
    })),
    ...snapshot.habitCompletions
      .filter((completion) => linkedHabitIds.has(completion.habitId))
      .map((completion) => {
        const habit = linkedHabits.find((item) => item.id === completion.habitId);
        return {
          id: `habit-${completion.id}`,
          kind: "habit" as const,
          date: completion.completedFor,
          label: habit?.title ?? "Habit",
          detail: `Checked off for ${completion.completedFor}`
        };
      }),
    ...snapshot.taskCompletions
      .filter((completion) => linkedTaskIds.has(completion.taskId))
      .map((completion) => {
        const task = linkedTasks.find((item) => item.id === completion.taskId);
        return {
          id: `task-${completion.id}`,
          kind: "task" as const,
          date: toDateKey(completion.completedAt),
          label: task?.title ?? "Task",
          detail: `Completed on ${toDateKey(completion.completedAt)}`
        };
      })
  ]
    .filter((event) => event.date >= startDate && event.date <= referenceDate)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));

  const calendar = Array.from({ length: days }, (_, index) => {
    const date = shiftDate(startDate, index);
    return {
      date,
      count: filteredEvents.filter((event) => event.date === date).length
    };
  });

  return {
    goal,
    percent: getGoalProgressPercent(goal),
    entryCount: goalLogs.length,
    linkedHabitCount: linkedHabits.length,
    linkedTaskCount: linkedTasks.length,
    filteredLogs,
    filteredEvents,
    calendar
  };
}
