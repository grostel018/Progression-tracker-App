import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  CategoryRecord,
  CompleteTaskInput,
  CreateCategoryInput,
  CreateDreamInput,
  CreateGoalInput,
  CreateHabitInput,
  CreateTaskInput,
  DreamRecord,
  GoalRecord,
  HabitCompletionRecord,
  HabitRecord,
  PlanningSnapshot,
  TaskCompletionRecord,
  TaskRecord,
  UpdateCategoryInput,
  UpdateDreamInput,
  UpdateGoalInput,
  UpdateHabitInput,
  UpdateTaskInput
} from "@/types/planning";

import { PlanningInputError } from "./errors";

const prismaWithHistory = prisma as typeof prisma & {
  habitCompletion: any;
  taskCompletion: any;
};

function serializeCategory(category: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status as CategoryRecord["status"],
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

function serializeDream(dream: {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  vision: string | null;
  status: string;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DreamRecord {
  return {
    id: dream.id,
    categoryId: dream.categoryId,
    title: dream.title,
    description: dream.description,
    vision: dream.vision,
    status: dream.status as DreamRecord["status"],
    targetDate: dream.targetDate?.toISOString() ?? null,
    createdAt: dream.createdAt.toISOString(),
    updatedAt: dream.updatedAt.toISOString()
  };
}

function serializeGoal(goal: {
  id: string;
  categoryId: string | null;
  dreamId: string | null;
  title: string;
  description: string | null;
  status: string;
  progressType: string;
  targetDate: Date | null;
  targetValue: number | null;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}): GoalRecord {
  return {
    id: goal.id,
    categoryId: goal.categoryId,
    dreamId: goal.dreamId,
    title: goal.title,
    description: goal.description,
    status: goal.status as GoalRecord["status"],
    progressType: goal.progressType as GoalRecord["progressType"],
    targetDate: goal.targetDate?.toISOString() ?? null,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString()
  };
}

function serializeHabit(habit: {
  id: string;
  goalId: string | null;
  title: string;
  description: string | null;
  status: string;
  frequency: string;
  customDays: unknown;
  createdAt: Date;
  updatedAt: Date;
}): HabitRecord {
  return {
    id: habit.id,
    goalId: habit.goalId,
    title: habit.title,
    description: habit.description,
    status: habit.status as HabitRecord["status"],
    frequency: habit.frequency as HabitRecord["frequency"],
    customDays: Array.isArray(habit.customDays) ? (habit.customDays as number[]) : null,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString()
  };
}

function serializeTask(task: {
  id: string;
  goalId: string | null;
  title: string;
  description: string | null;
  status: string;
  scheduledFor: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskRecord {
  return {
    id: task.id,
    goalId: task.goalId,
    title: task.title,
    description: task.description,
    status: task.status as TaskRecord["status"],
    scheduledFor: task.scheduledFor?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

function serializeHabitCompletion(completion: {
  id: string;
  habitId: string;
  completedFor: string;
  completedAt: Date;
  createdAt: Date;
}): HabitCompletionRecord {
  return {
    id: completion.id,
    habitId: completion.habitId,
    completedFor: completion.completedFor,
    completedAt: completion.completedAt.toISOString(),
    createdAt: completion.createdAt.toISOString()
  };
}

function serializeTaskCompletion(completion: {
  id: string;
  taskId: string;
  completedAt: Date;
  createdAt: Date;
}): TaskCompletionRecord {
  return {
    id: completion.id,
    taskId: completion.taskId,
    completedAt: completion.completedAt.toISOString(),
    createdAt: completion.createdAt.toISOString()
  };
}

async function ensureCategoryNameAvailable(userId: string, name: string, excludeId?: string): Promise<void> {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: { id: true }
  });

  if (duplicate) {
    throw new PlanningInputError("Category names need to stay unique in your workspace.", {
      name: "Choose a category name that is not already in this workspace."
    });
  }
}

export async function getPlanningSnapshotForUser(userId: string): Promise<PlanningSnapshot> {
  const [categories, dreams, goals, habits, tasks, habitCompletions, taskCompletions] = await Promise.all([
    prisma.category.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.dream.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.habit.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.task.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prismaWithHistory.habitCompletion.findMany({
      where: { habit: { userId } },
      orderBy: [{ completedFor: "desc" }, { completedAt: "desc" }]
    }),
    prismaWithHistory.taskCompletion.findMany({
      where: { task: { userId } },
      orderBy: { completedAt: "desc" }
    })
  ]);

  return {
    categories: categories.map(serializeCategory),
    dreams: dreams.map(serializeDream),
    goals: goals.map(serializeGoal),
    goalLogs: [],
    habits: habits.map(serializeHabit),
    tasks: tasks.map(serializeTask),
    habitCompletions: habitCompletions.map(serializeHabitCompletion),
    taskCompletions: taskCompletions.map(serializeTaskCompletion)
  };
}

export async function findOwnedCategoryId(userId: string, categoryId?: string): Promise<string | null> {
  if (!categoryId) {
    return null;
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true }
  });

  return category?.id ?? null;
}

export async function findOwnedDreamId(userId: string, dreamId?: string): Promise<string | null> {
  if (!dreamId) {
    return null;
  }

  const dream = await prisma.dream.findFirst({
    where: { id: dreamId, userId },
    select: { id: true }
  });

  return dream?.id ?? null;
}

export async function findOwnedGoalId(userId: string, goalId?: string): Promise<string | null> {
  if (!goalId) {
    return null;
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true }
  });

  return goal?.id ?? null;
}

export async function createCategoryRecord(userId: string, input: CreateCategoryInput): Promise<void> {
  await ensureCategoryNameAvailable(userId, input.name);

  await prisma.category.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null
    }
  });
}

export async function updateCategoryRecord(userId: string, input: UpdateCategoryInput): Promise<void> {
  await ensureCategoryNameAvailable(userId, input.name, input.id);

  const result = await prisma.category.updateMany({
    where: { id: input.id, userId },
    data: {
      name: input.name,
      description: input.description ?? null
    }
  });

  if (result.count === 0) {
    throw new Error("Category not found.");
  }
}

export async function archiveCategoryRecord(userId: string, id: string): Promise<void> {
  const result = await prisma.category.updateMany({
    where: { id, userId },
    data: {
      status: "ARCHIVED"
    }
  });

  if (result.count === 0) {
    throw new Error("Category not found.");
  }
}

export async function createDreamRecord(userId: string, input: CreateDreamInput, categoryId: string | null): Promise<void> {
  await prisma.dream.create({
    data: {
      userId,
      categoryId,
      title: input.title,
      description: input.description ?? null,
      vision: input.vision ?? null,
      targetDate: input.targetDate ? new Date(input.targetDate) : null
    }
  });
}

export async function updateDreamRecord(userId: string, input: UpdateDreamInput, categoryId: string | null): Promise<void> {
  const result = await prisma.dream.updateMany({
    where: { id: input.id, userId },
    data: {
      categoryId,
      title: input.title,
      description: input.description ?? null,
      vision: input.vision ?? null,
      targetDate: input.targetDate ? new Date(input.targetDate) : null
    }
  });

  if (result.count === 0) {
    throw new Error("Dream not found.");
  }
}

export async function archiveDreamRecord(userId: string, id: string): Promise<void> {
  const result = await prisma.dream.updateMany({
    where: { id, userId },
    data: {
      status: "ARCHIVED"
    }
  });

  if (result.count === 0) {
    throw new Error("Dream not found.");
  }
}

export async function createGoalRecord(userId: string, input: CreateGoalInput, categoryId: string | null, dreamId: string | null): Promise<void> {
  await prisma.goal.create({
    data: {
      userId,
      categoryId,
      dreamId,
      title: input.title,
      description: input.description ?? null,
      progressType: input.progressType,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      targetValue: input.targetValue ?? null,
      currentValue: 0
    }
  });
}

export async function updateGoalRecord(userId: string, input: UpdateGoalInput, categoryId: string | null, dreamId: string | null): Promise<void> {
  const result = await prisma.goal.updateMany({
    where: { id: input.id, userId },
    data: {
      categoryId,
      dreamId,
      title: input.title,
      description: input.description ?? null,
      progressType: input.progressType,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      targetValue: input.targetValue ?? null
    }
  });

  if (result.count === 0) {
    throw new Error("Goal not found.");
  }
}

export async function archiveGoalRecord(userId: string, id: string): Promise<void> {
  const result = await prisma.goal.updateMany({
    where: { id, userId },
    data: {
      status: "ARCHIVED"
    }
  });

  if (result.count === 0) {
    throw new Error("Goal not found.");
  }
}

export async function createHabitRecord(userId: string, input: CreateHabitInput, goalId: string | null): Promise<void> {
  await prisma.habit.create({
    data: {
      userId,
      goalId,
      title: input.title,
      description: input.description ?? null,
      frequency: input.frequency,
      ...(input.frequency === "CUSTOM" ? { customDays: input.customDays ?? [] } : {})
    }
  });
}

export async function updateHabitRecord(userId: string, input: UpdateHabitInput, goalId: string | null): Promise<void> {
  const result = await prisma.habit.updateMany({
    where: { id: input.id, userId },
    data: {
      goalId,
      title: input.title,
      description: input.description ?? null,
      frequency: input.frequency,
      customDays: input.frequency === "CUSTOM" ? input.customDays ?? [] : Prisma.JsonNull
    }
  });

  if (result.count === 0) {
    throw new Error("Habit not found.");
  }
}

export async function archiveHabitRecord(userId: string, id: string): Promise<void> {
  const result = await prisma.habit.updateMany({
    where: { id, userId },
    data: {
      status: "ARCHIVED"
    }
  });

  if (result.count === 0) {
    throw new Error("Habit not found.");
  }
}

export async function createHabitCompletionRecord(userId: string, habitId: string, completedFor: string): Promise<void> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true, status: true }
  });

  if (!habit) {
    throw new Error("Habit not found.");
  }

  if (habit.status === "ARCHIVED") {
    throw new PlanningInputError("Archived habits cannot record new completions right now.");
  }

  await prismaWithHistory.habitCompletion.upsert({
    where: {
      habitId_completedFor: {
        habitId: habit.id,
        completedFor
      }
    },
    update: {},
    create: {
      habitId: habit.id,
      completedFor
    }
  });
}

export async function removeHabitCompletionRecord(userId: string, habitId: string, completedFor: string): Promise<void> {
  await prismaWithHistory.habitCompletion.deleteMany({
    where: {
      habitId,
      completedFor,
      habit: { userId }
    }
  });
}

export async function createTaskRecord(userId: string, input: CreateTaskInput, goalId: string | null): Promise<void> {
  await prisma.task.create({
    data: {
      userId,
      goalId,
      title: input.title,
      description: input.description ?? null,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null
    }
  });
}

export async function updateTaskRecord(userId: string, input: UpdateTaskInput, goalId: string | null): Promise<void> {
  const result = await prisma.task.updateMany({
    where: { id: input.id, userId },
    data: {
      goalId,
      title: input.title,
      description: input.description ?? null,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null
    }
  });

  if (result.count === 0) {
    throw new Error("Task not found.");
  }
}

export async function archiveTaskRecord(userId: string, id: string): Promise<void> {
  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: {
      status: "ARCHIVED"
    }
  });

  if (result.count === 0) {
    throw new Error("Task not found.");
  }
}

export async function completeTaskRecord(userId: string, input: CompleteTaskInput): Promise<void> {
  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId },
    select: { id: true, status: true }
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.status === "ARCHIVED") {
    throw new PlanningInputError("Archived tasks cannot be completed right now.");
  }

  if (task.status === "DONE") {
    return;
  }

  const completedAt = new Date();

  await prisma.$transaction([
    prisma.task.update({
      where: { id: task.id },
      data: {
        status: "DONE",
        completedAt
      }
    }),
    prismaWithHistory.taskCompletion.create({
      data: {
        taskId: task.id,
        completedAt
      }
    })
  ]);
}


