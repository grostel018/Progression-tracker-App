import type { GoalRecord, HabitCompletionRecord, HabitRecord, PlanningSnapshot, TaskCompletionRecord, TaskRecord } from "@/types/planning";
import type { WeeklyReviewSummarySnapshot } from "@/types/weekly-review";

import { buildPlanningActivityInsights, type PlanningActivityEvent } from "@/features/planning/insights";
import { getLocalCalendarDateValue, isHabitScheduledForDate } from "@/features/planning/recurrence";

export type WeeklyReviewDay = {
  date: string;
  label: string;
  total: number;
  habitCount: number;
  taskCount: number;
  isToday: boolean;
  isActive: boolean;
};

export type WeeklyReviewInsights = WeeklyReviewSummarySnapshot & {
  days: WeeklyReviewDay[];
  recentActivity: PlanningActivityEvent[];
};

function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function shiftCalendarDate(dateValue: string, deltaDays: number): string {
  const nextDate = new Date(`${dateValue}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + deltaDays);
  return getLocalCalendarDateValue(nextDate);
}

function getWeekStart(referenceDate: string): string {
  const date = new Date(`${referenceDate}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return getLocalCalendarDateValue(date);
}

function toCalendarDate(value: string): string {
  return value.slice(0, 10);
}

function buildWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => shiftCalendarDate(weekStart, index));
}

function formatWeekday(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${dateValue}T00:00:00`));
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

export function buildWeeklyReviewInsights(
  snapshot: PlanningSnapshot,
  referenceDate: string = getLocalCalendarDateValue()
): WeeklyReviewInsights {
  const weekStart = getWeekStart(referenceDate);
  const weekDates = buildWeekDates(weekStart);
  const weekEnd = weekDates[6] ?? referenceDate;
  const reviewWindowEnd = referenceDate < weekEnd ? referenceDate : weekEnd;
  const reviewDates = weekDates.filter((dateValue) => dateValue <= reviewWindowEnd);
  const habitsById = new Map(snapshot.habits.map((habit) => [habit.id, habit]));
  const tasksById = new Map(snapshot.tasks.map((task) => [task.id, task]));
  const goalsById = new Map(snapshot.goals.map((goal) => [goal.id, goal]));
  const goalCounts = new Map<string, number>();

  const habitEvents = snapshot.habitCompletions
    .filter((completion) => completion.completedFor >= weekStart && completion.completedFor <= reviewWindowEnd)
    .map((completion) => {
      const habit = habitsById.get(completion.habitId);
      const goal = habit?.goalId ? goalsById.get(habit.goalId) : undefined;

      if (goal?.id) {
        goalCounts.set(goal.id, (goalCounts.get(goal.id) ?? 0) + 1);
      }

      return buildHabitActivityEvent(completion, habit, goal);
    });

  const taskEvents = snapshot.taskCompletions
    .filter((completion) => {
      const completionDate = toCalendarDate(completion.completedAt);
      return completionDate >= weekStart && completionDate <= reviewWindowEnd;
    })
    .map((completion) => {
      const task = tasksById.get(completion.taskId);
      const goal = task?.goalId ? goalsById.get(task.goalId) : undefined;

      if (goal?.id) {
        goalCounts.set(goal.id, (goalCounts.get(goal.id) ?? 0) + 1);
      }

      return buildTaskActivityEvent(completion, task, goal);
    });

  const weeklyEvents = [...habitEvents, ...taskEvents].sort((left, right) => right.completedAt.localeCompare(left.completedAt));
  const countsByDate = new Map<string, { total: number; habits: number; tasks: number }>();

  for (const dateValue of reviewDates) {
    countsByDate.set(dateValue, { total: 0, habits: 0, tasks: 0 });
  }

  for (const event of weeklyEvents) {
    const entry = countsByDate.get(event.completionDate) ?? { total: 0, habits: 0, tasks: 0 };
    entry.total += 1;
    if (event.kind === "habit") {
      entry.habits += 1;
    } else {
      entry.tasks += 1;
    }
    countsByDate.set(event.completionDate, entry);
  }

  const days = weekDates.map((dateValue) => {
    const entry = countsByDate.get(dateValue) ?? { total: 0, habits: 0, tasks: 0 };

    return {
      date: dateValue,
      label: formatWeekday(dateValue),
      total: entry.total,
      habitCount: entry.habits,
      taskCount: entry.tasks,
      isToday: dateValue === referenceDate,
      isActive: entry.total > 0
    };
  });

  const activeHabits = snapshot.habits.filter((habit) => habit.status === "ACTIVE");
  const scheduledHabitCount = reviewDates.reduce(
    (total, dateValue) => total + activeHabits.filter((habit) => isHabitScheduledForDate(habit, dateValue)).length,
    0
  );
  const missedHabitCount = Math.max(scheduledHabitCount - habitEvents.length, 0);
  const completedTaskCount = taskEvents.length;
  const openTaskCount = snapshot.tasks.filter((task) => task.status === "TODO").length;
  const openScheduledTaskCount = snapshot.tasks.filter((task) => {
    if (task.status !== "TODO" || !task.scheduledFor) {
      return false;
    }

    const scheduledDate = toCalendarDate(task.scheduledFor);
    return scheduledDate >= weekStart && scheduledDate <= reviewWindowEnd;
  }).length;
  const activeDays = reviewDates.filter((dateValue) => (countsByDate.get(dateValue)?.total ?? 0) > 0).length;
  const topGoal = [...goalCounts.entries()]
    .map(([goalId, count]) => ({ goal: goalsById.get(goalId), count }))
    .filter((entry): entry is { goal: GoalRecord; count: number } => Boolean(entry.goal))
    .sort((left, right) => right.count - left.count || left.goal.title.localeCompare(right.goal.title))[0];
  const activityInsights = buildPlanningActivityInsights(snapshot, referenceDate);
  const wins = [
    weeklyEvents.length > 0 ? `You logged ${pluralize(weeklyEvents.length, "action")} this week.` : null,
    activeDays >= 3 ? `You showed up on ${pluralize(activeDays, "day")} this week.` : null,
    activityInsights.currentStreakDays > 1 ? `Your current streak is ${pluralize(activityInsights.currentStreakDays, "day")}.` : null,
    topGoal?.goal.title ? `Most of this week's effort went into ${topGoal.goal.title}.` : null
  ].filter((value): value is string => Boolean(value)).slice(0, 3);
  const missedAreas = [
    missedHabitCount > 0 ? `${pluralize(missedHabitCount, "scheduled habit check")} were missed so far this week.` : null,
    openScheduledTaskCount > 0 ? `${pluralize(openScheduledTaskCount, "scheduled task")} from this week are still open.` : null,
    activeDays > 0 && activeDays < 3 ? `Consistency was light with activity on only ${pluralize(activeDays, "day")}.` : null,
    weeklyEvents.length === 0 ? "No activity has been recorded yet this week." : null
  ].filter((value): value is string => Boolean(value)).slice(0, 3);

  return {
    referenceDate,
    weekStart,
    weekEnd,
    totalCompletions: weeklyEvents.length,
    habitCompletions: habitEvents.length,
    taskCompletions: taskEvents.length,
    activeDays,
    scheduledHabitCount,
    missedHabitCount,
    completedTaskCount,
    openTaskCount,
    openScheduledTaskCount,
    currentStreakDays: activityInsights.currentStreakDays,
    topGoalTitle: topGoal?.goal.title ?? null,
    wins: wins.length > 0 ? wins : ["The week is still open. One real action is enough to seed the next review."],
    missedAreas: missedAreas.length > 0 ? missedAreas : ["No obvious missed area stands out from the current tracking data."],
    days,
    recentActivity: weeklyEvents.slice(0, 6)
  };
}

export function toWeeklyReviewSummarySnapshot(insights: WeeklyReviewInsights): WeeklyReviewSummarySnapshot {
  return {
    referenceDate: insights.referenceDate,
    weekStart: insights.weekStart,
    weekEnd: insights.weekEnd,
    totalCompletions: insights.totalCompletions,
    habitCompletions: insights.habitCompletions,
    taskCompletions: insights.taskCompletions,
    activeDays: insights.activeDays,
    scheduledHabitCount: insights.scheduledHabitCount,
    missedHabitCount: insights.missedHabitCount,
    completedTaskCount: insights.completedTaskCount,
    openTaskCount: insights.openTaskCount,
    openScheduledTaskCount: insights.openScheduledTaskCount,
    currentStreakDays: insights.currentStreakDays,
    topGoalTitle: insights.topGoalTitle ?? null,
    wins: insights.wins,
    missedAreas: insights.missedAreas
  };
}
