import {
  completeHabitSchema,
  completeTaskSchema,
  createCategorySchema,
  createDreamSchema,
  createGoalLogSchema,
  createGoalSchema,
  createHabitSchema,
  createTaskSchema,
  updateCategorySchema,
  updateDreamSchema,
  updateGoalLogSchema,
  updateGoalSchema,
  updateHabitSchema,
  updateTaskSchema
} from "./schema";
import {
  archiveCategoryRecord,
  archiveDreamRecord,
  archiveGoalRecord,
  archiveHabitRecord,
  archiveTaskRecord,
  completeTaskRecord,
  createCategoryRecord,
  createDreamRecord,
  createGoalRecord,
  createHabitCompletionRecord,
  createHabitRecord,
  createTaskRecord,
  findOwnedCategoryId,
  findOwnedDreamId,
  findOwnedGoalId,
  getPlanningSnapshotForUser,
  removeHabitCompletionRecord,
  updateCategoryRecord,
  updateDreamRecord,
  updateGoalRecord,
  updateHabitRecord,
  updateTaskRecord
} from "./repository";
import { createGoalLogRecord, deleteGoalLogRecord, getGoalLogsForUser, updateGoalLogRecord } from "./progress-repository";
import type {
  CompleteHabitInput,
  CompleteTaskInput,
  CreateCategoryInput,
  CreateDreamInput,
  CreateGoalInput,
  CreateGoalLogInput,
  CreateHabitInput,
  CreateTaskInput,
  DeleteGoalLogInput,
  PlanningSnapshot,
  UpdateCategoryInput,
  UpdateDreamInput,
  UpdateGoalInput,
  UpdateGoalLogInput,
  UpdateHabitInput,
  UpdateTaskInput
} from "@/types/planning";

import { PlanningInputError } from "./errors";

async function buildPlanningSnapshot(userId: string): Promise<PlanningSnapshot> {
  const [snapshot, goalLogs] = await Promise.all([
    getPlanningSnapshotForUser(userId),
    getGoalLogsForUser(userId)
  ]);

  return {
    ...snapshot,
    goalLogs
  };
}

async function resolveCategoryId(userId: string, categoryId?: string): Promise<string | null> {
  const resolved = await findOwnedCategoryId(userId, categoryId);

  if (categoryId && !resolved) {
    throw new PlanningInputError("Choose a category from your workspace.", {
      categoryId: "Choose a category from your workspace."
    });
  }

  return resolved;
}

async function resolveDreamId(userId: string, dreamId?: string): Promise<string | null> {
  const resolved = await findOwnedDreamId(userId, dreamId);

  if (dreamId && !resolved) {
    throw new PlanningInputError("Choose a dream from your workspace.", {
      dreamId: "Choose a dream from your workspace."
    });
  }

  return resolved;
}

async function resolveGoalId(userId: string, goalId?: string): Promise<string | null> {
  const resolved = await findOwnedGoalId(userId, goalId);

  if (goalId && !resolved) {
    throw new PlanningInputError("Choose a goal from your workspace.", {
      goalId: "Choose a goal from your workspace."
    });
  }

  return resolved;
}

export async function getCloudPlanningSnapshot(userId: string): Promise<PlanningSnapshot> {
  return buildPlanningSnapshot(userId);
}

export async function createCategory(userId: string, input: CreateCategoryInput): Promise<PlanningSnapshot> {
  const values = createCategorySchema.parse(input);
  await createCategoryRecord(userId, values);
  return buildPlanningSnapshot(userId);
}

export async function updateCategory(userId: string, input: UpdateCategoryInput): Promise<PlanningSnapshot> {
  const values = updateCategorySchema.parse(input);
  await updateCategoryRecord(userId, values);
  return buildPlanningSnapshot(userId);
}

export async function archiveCategory(userId: string, id: string): Promise<PlanningSnapshot> {
  await archiveCategoryRecord(userId, id);
  return buildPlanningSnapshot(userId);
}

export async function createDream(userId: string, input: CreateDreamInput): Promise<PlanningSnapshot> {
  const values = createDreamSchema.parse(input);
  const categoryId = await resolveCategoryId(userId, values.categoryId);
  await createDreamRecord(userId, values, categoryId);
  return buildPlanningSnapshot(userId);
}

export async function updateDream(userId: string, input: UpdateDreamInput): Promise<PlanningSnapshot> {
  const values = updateDreamSchema.parse(input);
  const categoryId = await resolveCategoryId(userId, values.categoryId);
  await updateDreamRecord(userId, values, categoryId);
  return buildPlanningSnapshot(userId);
}

export async function archiveDream(userId: string, id: string): Promise<PlanningSnapshot> {
  await archiveDreamRecord(userId, id);
  return buildPlanningSnapshot(userId);
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<PlanningSnapshot> {
  const values = createGoalSchema.parse(input);
  const categoryId = await resolveCategoryId(userId, values.categoryId);
  const dreamId = await resolveDreamId(userId, values.dreamId);
  await createGoalRecord(userId, values, categoryId, dreamId);
  return buildPlanningSnapshot(userId);
}

export async function updateGoal(userId: string, input: UpdateGoalInput): Promise<PlanningSnapshot> {
  const values = updateGoalSchema.parse(input);
  const categoryId = await resolveCategoryId(userId, values.categoryId);
  const dreamId = await resolveDreamId(userId, values.dreamId);
  await updateGoalRecord(userId, values, categoryId, dreamId);
  return buildPlanningSnapshot(userId);
}

export async function archiveGoal(userId: string, id: string): Promise<PlanningSnapshot> {
  await archiveGoalRecord(userId, id);
  return buildPlanningSnapshot(userId);
}

export async function createGoalLog(userId: string, input: CreateGoalLogInput): Promise<PlanningSnapshot> {
  const values = createGoalLogSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);

  if (!goalId) {
    throw new PlanningInputError("Choose a goal from your workspace.", {
      goalId: "Choose a goal from your workspace."
    });
  }

  await createGoalLogRecord(userId, {
    goalId,
    loggedAt: values.loggedAt,
    progressValue: values.progressValue,
    note: values.note
  });

  return buildPlanningSnapshot(userId);
}

export async function updateGoalLog(userId: string, input: UpdateGoalLogInput): Promise<PlanningSnapshot> {
  const values = updateGoalLogSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);

  if (!goalId) {
    throw new PlanningInputError("Choose a goal from your workspace.", {
      goalId: "Choose a goal from your workspace."
    });
  }

  await updateGoalLogRecord(userId, {
    id: values.id,
    goalId,
    loggedAt: values.loggedAt,
    progressValue: values.progressValue,
    note: values.note
  });

  return buildPlanningSnapshot(userId);
}

export async function deleteGoalLog(userId: string, input: DeleteGoalLogInput): Promise<PlanningSnapshot> {
  await deleteGoalLogRecord(userId, input);
  return buildPlanningSnapshot(userId);
}

export async function createHabit(userId: string, input: CreateHabitInput): Promise<PlanningSnapshot> {
  const values = createHabitSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);
  await createHabitRecord(userId, values, goalId);
  return buildPlanningSnapshot(userId);
}

export async function updateHabit(userId: string, input: UpdateHabitInput): Promise<PlanningSnapshot> {
  const values = updateHabitSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);
  await updateHabitRecord(userId, values, goalId);
  return buildPlanningSnapshot(userId);
}

export async function archiveHabit(userId: string, id: string): Promise<PlanningSnapshot> {
  await archiveHabitRecord(userId, id);
  return buildPlanningSnapshot(userId);
}

export async function completeHabit(userId: string, input: CompleteHabitInput): Promise<PlanningSnapshot> {
  const values = completeHabitSchema.parse(input);
  await createHabitCompletionRecord(userId, values.habitId, values.completedFor ?? new Date().toISOString().slice(0, 10));
  return buildPlanningSnapshot(userId);
}

export async function removeHabitCompletion(userId: string, input: CompleteHabitInput): Promise<PlanningSnapshot> {
  const values = completeHabitSchema.parse(input);
  await removeHabitCompletionRecord(userId, values.habitId, values.completedFor ?? new Date().toISOString().slice(0, 10));
  return buildPlanningSnapshot(userId);
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<PlanningSnapshot> {
  const values = createTaskSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);
  await createTaskRecord(userId, values, goalId);
  return buildPlanningSnapshot(userId);
}

export async function updateTask(userId: string, input: UpdateTaskInput): Promise<PlanningSnapshot> {
  const values = updateTaskSchema.parse(input);
  const goalId = await resolveGoalId(userId, values.goalId);
  await updateTaskRecord(userId, values, goalId);
  return buildPlanningSnapshot(userId);
}

export async function archiveTask(userId: string, id: string): Promise<PlanningSnapshot> {
  await archiveTaskRecord(userId, id);
  return buildPlanningSnapshot(userId);
}

export async function completeTask(userId: string, input: CompleteTaskInput): Promise<PlanningSnapshot> {
  const values = completeTaskSchema.parse(input);
  await completeTaskRecord(userId, values);
  return buildPlanningSnapshot(userId);
}
