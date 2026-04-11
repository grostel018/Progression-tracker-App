import type { GoalRecord, HabitCompletionRecord, HabitRecord, PlanningSnapshot, TaskCompletionRecord, TaskRecord } from "@/types/planning";

import { getLocalCalendarDateValue, isHabitScheduledForDate } from "./recurrence";

export type PlanningActivityEvent = {
  id: string;
  kind: "habit" | "task";
  title: string;
  goalTitle?: string | null;
  completedAt: string;
  completionDate: string;
  detail: string;
};

export type PlanningActivityInsights = {
  referenceDate: string;
  totalCompletionCount: number;
  completionsToday: number;
  habitCompletionsToday: number;
  taskCompletionsToday: number;
  completionsLast7Days: number;
  activeDaysLast7: number;
  currentStreakDays: number;
  dueHabitsToday: number;
  openTaskCount: number;
  completedTaskCount: number;
  topGoalTitle?: string | null;
  topGoalCompletionCount: number;
  recentActivity: PlanningActivityEvent[];
};

function shiftCalendarDate(dateValue: string, deltaDays: number): string {
  const nextDate = new Date(`${dateValue}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + deltaDays);
  return getLocalCalendarDateValue(nextDate);
}

function toCalendarDate(value: string): string {
  return value.slice(0, 10);
}

function inLastSevenDays(referenceDate: string, candidateDate: string): boolean {
  const oldestDate = shiftCalendarDate(referenceDate, -6);
  return candidateDate >= oldestDate && candidateDate <= referenceDate;
}

function buildHabitActivityEvent(
  completion: HabitCompletionRecord,
  habit: HabitRecord | undefined,
  goal: GoalRecord | undefined
): PlanningActivityEvent {
  return {
    id: `habit-${completion.id}`,
    kind: "habit",
    title: habit?.title ?? "Habit",
    goalTitle: goal?.title ?? null,
    completedAt: completion.completedAt,
    completionDate: completion.completedFor,
    detail: `Checked off for ${completion.completedFor}`
  };
}

function buildTaskActivityEvent(
  completion: TaskCompletionRecord,
  task: TaskRecord | undefined,
  goal: GoalRecord | undefined
): PlanningActivityEvent {
  return {
    id: `task-${completion.id}`,
    kind: "task",
    title: task?.title ?? "Task",
    goalTitle: goal?.title ?? null,
    completedAt: completion.completedAt,
    completionDate: toCalendarDate(completion.completedAt),
    detail: `Finished on ${toCalendarDate(completion.completedAt)}`
  };
}

function countCurrentStreak(activityDates: Set<string>, referenceDate: string): number {
  let streak = 0;
  let cursor = referenceDate;

  while (activityDates.has(cursor)) {
    streak += 1;
    cursor = shiftCalendarDate(cursor, -1);
  }

  return streak;
}

export function buildPlanningActivityInsights(
  snapshot: PlanningSnapshot,
  referenceDate: string = getLocalCalendarDateValue()
): PlanningActivityInsights {
  const habitsById = new Map(snapshot.habits.map((habit) => [habit.id, habit]));
  const tasksById = new Map(snapshot.tasks.map((task) => [task.id, task]));
  const goalsById = new Map(snapshot.goals.map((goal) => [goal.id, goal]));
  const goalCompletionCounts = new Map<string, number>();

  const habitEvents = snapshot.habitCompletions.map((completion) => {
    const habit = habitsById.get(completion.habitId);
    const goal = habit?.goalId ? goalsById.get(habit.goalId) : undefined;

    if (goal?.id) {
      goalCompletionCounts.set(goal.id, (goalCompletionCounts.get(goal.id) ?? 0) + 1);
    }

    return buildHabitActivityEvent(completion, habit, goal);
  });

  const taskEvents = snapshot.taskCompletions.map((completion) => {
    const task = tasksById.get(completion.taskId);
    const goal = task?.goalId ? goalsById.get(task.goalId) : undefined;

    if (goal?.id) {
      goalCompletionCounts.set(goal.id, (goalCompletionCounts.get(goal.id) ?? 0) + 1);
    }

    return buildTaskActivityEvent(completion, task, goal);
  });

  const recentActivity = [...habitEvents, ...taskEvents]
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
    .slice(0, 6);

  const allCompletionDates = new Set<string>([
    ...habitEvents.map((event) => event.completionDate),
    ...taskEvents.map((event) => event.completionDate)
  ]);

  const topGoal = [...goalCompletionCounts.entries()]
    .map(([goalId, count]) => ({ goal: goalsById.get(goalId), count }))
    .filter((entry): entry is { goal: GoalRecord; count: number } => Boolean(entry.goal))
    .sort((left, right) => right.count - left.count || left.goal.title.localeCompare(right.goal.title))[0];

  const habitCompletionsToday = habitEvents.filter((event) => event.completionDate === referenceDate).length;
  const taskCompletionsToday = taskEvents.filter((event) => event.completionDate === referenceDate).length;
  const completionsLast7Days = [...habitEvents, ...taskEvents].filter((event) => inLastSevenDays(referenceDate, event.completionDate)).length;
  const activeDaysLast7 = [...allCompletionDates].filter((dateValue) => inLastSevenDays(referenceDate, dateValue)).length;
  const dueHabitsToday = snapshot.habits.filter((habit) => habit.status === "ACTIVE" && isHabitScheduledForDate(habit, referenceDate)).length;
  const openTaskCount = snapshot.tasks.filter((task) => task.status === "TODO").length;
  const completedTaskCount = snapshot.tasks.filter((task) => task.status === "DONE").length;

  return {
    referenceDate,
    totalCompletionCount: snapshot.habitCompletions.length + snapshot.taskCompletions.length,
    completionsToday: habitCompletionsToday + taskCompletionsToday,
    habitCompletionsToday,
    taskCompletionsToday,
    completionsLast7Days,
    activeDaysLast7,
    currentStreakDays: countCurrentStreak(allCompletionDates, referenceDate),
    dueHabitsToday,
    openTaskCount,
    completedTaskCount,
    topGoalTitle: topGoal?.goal.title ?? null,
    topGoalCompletionCount: topGoal?.count ?? 0,
    recentActivity
  };
}
