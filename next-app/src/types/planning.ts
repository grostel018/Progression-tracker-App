export const CATEGORY_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export const DREAM_STATUSES = ["ACTIVE", "ARCHIVED", "COMPLETED"] as const;
export const GOAL_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
export const GOAL_PROGRESS_TYPES = ["BINARY", "PERCENT", "TARGET_COUNT"] as const;
export const HABIT_STATUSES = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export const HABIT_FREQUENCIES = ["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"] as const;
export const TASK_STATUSES = ["TODO", "DONE", "ARCHIVED"] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];
export type DreamStatus = (typeof DREAM_STATUSES)[number];
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type GoalProgressType = (typeof GOAL_PROGRESS_TYPES)[number];
export type HabitStatus = (typeof HABIT_STATUSES)[number];
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type CategoryRecord = {
  id: string;
  name: string;
  description?: string | null;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlanningEntityBase = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DreamRecord = PlanningEntityBase & {
  categoryId?: string | null;
  status: DreamStatus;
  vision?: string | null;
  targetDate?: string | null;
};

export type GoalRecord = PlanningEntityBase & {
  categoryId?: string | null;
  dreamId?: string | null;
  status: GoalStatus;
  progressType: GoalProgressType;
  targetDate?: string | null;
  targetValue?: number | null;
  currentValue: number;
};

export type GoalLogRecord = {
  id: string;
  goalId: string;
  loggedAt: string;
  progressValue: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HabitRecord = PlanningEntityBase & {
  goalId?: string | null;
  status: HabitStatus;
  frequency: HabitFrequency;
  customDays?: number[] | null;
};

export type TaskRecord = PlanningEntityBase & {
  goalId?: string | null;
  status: TaskStatus;
  scheduledFor?: string | null;
  completedAt?: string | null;
};

export type HabitCompletionRecord = {
  id: string;
  habitId: string;
  completedFor: string;
  completedAt: string;
  createdAt: string;
};

export type TaskCompletionRecord = {
  id: string;
  taskId: string;
  completedAt: string;
  createdAt: string;
};

export type PlanningSnapshot = {
  categories: CategoryRecord[];
  dreams: DreamRecord[];
  goals: GoalRecord[];
  goalLogs?: GoalLogRecord[];
  habits: HabitRecord[];
  tasks: TaskRecord[];
  habitCompletions: HabitCompletionRecord[];
  taskCompletions: TaskCompletionRecord[];
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateCategoryInput = CreateCategoryInput & {
  id: string;
};

export type CreateDreamInput = {
  title: string;
  description?: string;
  vision?: string;
  categoryId?: string;
  targetDate?: string;
};

export type UpdateDreamInput = CreateDreamInput & {
  id: string;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  categoryId?: string;
  dreamId?: string;
  progressType: GoalProgressType;
  targetDate?: string;
  targetValue?: number | null;
};

export type UpdateGoalInput = CreateGoalInput & {
  id: string;
};

export type CreateGoalLogInput = {
  goalId: string;
  loggedAt?: string;
  progressValue: number;
  note?: string;
};

export type UpdateGoalLogInput = CreateGoalLogInput & {
  id: string;
};

export type DeleteGoalLogInput = {
  id: string;
  goalId: string;
};

export type CreateHabitInput = {
  title: string;
  description?: string;
  goalId?: string;
  frequency: HabitFrequency;
  customDays?: number[] | null;
};

export type UpdateHabitInput = CreateHabitInput & {
  id: string;
};

export type CompleteHabitInput = {
  habitId: string;
  completedFor?: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  goalId?: string;
  scheduledFor?: string;
};

export type UpdateTaskInput = CreateTaskInput & {
  id: string;
};

export type CompleteTaskInput = {
  taskId: string;
};

