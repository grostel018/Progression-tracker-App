import type { ZodType } from "zod";

import {
  categoryRecordSchema,
  createCategorySchema,
  createDreamSchema,
  createGoalSchema,
  createHabitSchema,
  createTaskSchema,
  dreamRecordSchema,
  goalLogRecordSchema,
  goalRecordSchema,
  habitCompletionRecordSchema,
  habitRecordSchema,
  planningSnapshotSchema,
  taskCompletionRecordSchema,
  taskRecordSchema,
  updateCategorySchema,
  updateDreamSchema,
  updateGoalSchema,
  updateHabitSchema,
  updateTaskSchema,
  completeHabitSchema,
  completeTaskSchema
} from "@/features/planning/schema";
import { getLocalCalendarDateValue } from "@/features/planning/recurrence";
import { PlanningInputError } from "@/features/planning/errors";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type {
  CategoryRecord,
  CompleteHabitInput,
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

import { buildLocalRecordKey, LOCAL_RECORD_NAMESPACES } from "./storage";

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readParsedRecords<TValue>(adapter: StorageAdapter, prefix: string, parser: ZodType<TValue>): Promise<TValue[]> {
  const keys = await adapter.listKeys(prefix);
  const records = await Promise.all(keys.map((key) => adapter.read<unknown>(key)));

  return records.flatMap((record) => {
    if (!record?.value) {
      return [];
    }

    const parsed = parser.safeParse(record.value);

    return parsed.success ? [parsed.data] : [];
  });
}

function byUpdatedAtDesc<TValue extends { updatedAt: string }>(left: TValue, right: TValue): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function byCompletedAtDesc<TValue extends { completedAt: string }>(left: TValue, right: TValue): number {
  return right.completedAt.localeCompare(left.completedAt);
}

function byHabitCompletionDesc(left: HabitCompletionRecord, right: HabitCompletionRecord): number {
  return right.completedFor.localeCompare(left.completedFor) || right.completedAt.localeCompare(left.completedAt);
}

function byGoalLogDesc(left: { loggedAt: string; updatedAt: string }, right: { loggedAt: string; updatedAt: string }): number {
  return right.loggedAt.localeCompare(left.loggedAt) || right.updatedAt.localeCompare(left.updatedAt);
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function ensureCategoryNameAvailable(snapshot: PlanningSnapshot, name: string, excludeId?: string): void {
  const duplicate = snapshot.categories.find((category) => normalizeCategoryName(category.name) === normalizeCategoryName(name) && category.id !== excludeId);

  if (duplicate) {
    throw new PlanningInputError("Category names need to stay unique in your workspace.", {
      name: "Choose a category name that is not already in this workspace."
    });
  }
}

function resolveOwnedCategoryId(snapshot: PlanningSnapshot, categoryId?: string): string | null {
  if (!categoryId) {
    return null;
  }

  const category = snapshot.categories.find((item) => item.id === categoryId);

  if (!category) {
    throw new PlanningInputError("Choose a category from your workspace.", {
      categoryId: "Choose a category from your workspace."
    });
  }

  return category.id;
}

function resolveOwnedDreamId(snapshot: PlanningSnapshot, dreamId?: string): string | null {
  if (!dreamId) {
    return null;
  }

  const dream = snapshot.dreams.find((item) => item.id === dreamId);

  if (!dream) {
    throw new PlanningInputError("Choose a dream from your workspace.", {
      dreamId: "Choose a dream from your workspace."
    });
  }

  return dream.id;
}

function resolveOwnedGoalId(snapshot: PlanningSnapshot, goalId?: string): string | null {
  if (!goalId) {
    return null;
  }

  const goal = snapshot.goals.find((item) => item.id === goalId);

  if (!goal) {
    throw new PlanningInputError("Choose a goal from your workspace.", {
      goalId: "Choose a goal from your workspace."
    });
  }

  return goal.id;
}

function resolveOwnedHabit(snapshot: PlanningSnapshot, habitId: string): HabitRecord {
  const habit = snapshot.habits.find((item) => item.id === habitId);

  if (!habit) {
    throw new Error("Habit not found.");
  }

  return habit;
}

function resolveOwnedTask(snapshot: PlanningSnapshot, taskId: string): TaskRecord {
  const task = snapshot.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
}

async function writeRecord<TValue extends { id: string }>(adapter: StorageAdapter, namespace: string, record: TValue & { updatedAt?: string }): Promise<void> {
  await adapter.write({
    key: buildLocalRecordKey(namespace as never, record.id),
    value: record,
    updatedAt: record.updatedAt ?? nowIso()
  });
}

export function createLocalPlanningService(adapter: StorageAdapter = new IndexedDbStorageAdapter()) {
  async function getSnapshot(): Promise<PlanningSnapshot> {
    const available = await adapter.isAvailable();

    if (!available) {
      return planningSnapshotSchema.parse({
        categories: [],
        dreams: [],
        goals: [],
        goalLogs: [],
        habits: [],
        tasks: [],
        habitCompletions: [],
        taskCompletions: []
      });
    }

    const [categories, dreams, goals, goalLogs, habits, tasks, habitCompletions, taskCompletions] = await Promise.all([
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.categories, ""), categoryRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.dreams, ""), dreamRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goals, ""), goalRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goalLogs, ""), goalLogRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.habits, ""), habitRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.tasks, ""), taskRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.habitCompletions, ""), habitCompletionRecordSchema),
      readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.taskCompletions, ""), taskCompletionRecordSchema)
    ]);

    return planningSnapshotSchema.parse({
      categories: categories.sort(byUpdatedAtDesc),
      dreams: dreams.sort(byUpdatedAtDesc),
      goals: goals.sort(byUpdatedAtDesc),
      goalLogs: goalLogs.sort(byGoalLogDesc),
      habits: habits.sort(byUpdatedAtDesc),
      tasks: tasks.sort(byUpdatedAtDesc),
      habitCompletions: habitCompletions.sort(byHabitCompletionDesc),
      taskCompletions: taskCompletions.sort(byCompletedAtDesc)
    });
  }

  async function saveCategory(input: CreateCategoryInput): Promise<PlanningSnapshot> {
    const values = createCategorySchema.parse(input);
    const snapshot = await getSnapshot();
    ensureCategoryNameAvailable(snapshot, values.name);
    const timestamp = nowIso();
    const record: CategoryRecord = {
      id: createLocalId("category"),
      name: values.name,
      description: values.description ?? null,
      status: "ACTIVE",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.categories, record);
    return getSnapshot();
  }

  async function updateCategory(input: UpdateCategoryInput): Promise<PlanningSnapshot> {
    const values = updateCategorySchema.parse(input);
    const snapshot = await getSnapshot();
    ensureCategoryNameAvailable(snapshot, values.name, values.id);
    const existing = snapshot.categories.find((item) => item.id === values.id);

    if (!existing) {
      throw new Error("Category not found.");
    }

    const record: CategoryRecord = {
      ...existing,
      name: values.name,
      description: values.description ?? null,
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.categories, record);
    return getSnapshot();
  }

  async function archiveCategory(id: string): Promise<PlanningSnapshot> {
    const snapshot = await getSnapshot();
    const existing = snapshot.categories.find((item) => item.id === id);

    if (!existing) {
      throw new Error("Category not found.");
    }

    const record: CategoryRecord = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.categories, record);
    return getSnapshot();
  }

  async function saveDream(input: CreateDreamInput): Promise<PlanningSnapshot> {
    const values = createDreamSchema.parse(input);
    const snapshot = await getSnapshot();
    const categoryId = resolveOwnedCategoryId(snapshot, values.categoryId);
    const timestamp = nowIso();
    const record: DreamRecord = {
      id: createLocalId("dream"),
      categoryId,
      title: values.title,
      description: values.description ?? null,
      vision: values.vision ?? null,
      status: "ACTIVE",
      targetDate: values.targetDate ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.dreams, record);
    return getSnapshot();
  }

  async function updateDream(input: UpdateDreamInput): Promise<PlanningSnapshot> {
    const values = updateDreamSchema.parse(input);
    const snapshot = await getSnapshot();
    const existing = snapshot.dreams.find((item) => item.id === values.id);

    if (!existing) {
      throw new Error("Dream not found.");
    }

    const categoryId = resolveOwnedCategoryId(snapshot, values.categoryId);
    const record: DreamRecord = {
      ...existing,
      categoryId,
      title: values.title,
      description: values.description ?? null,
      vision: values.vision ?? null,
      targetDate: values.targetDate ?? null,
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.dreams, record);
    return getSnapshot();
  }

  async function archiveDream(id: string): Promise<PlanningSnapshot> {
    const snapshot = await getSnapshot();
    const existing = snapshot.dreams.find((item) => item.id === id);

    if (!existing) {
      throw new Error("Dream not found.");
    }

    const record: DreamRecord = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.dreams, record);
    return getSnapshot();
  }

  async function saveGoal(input: CreateGoalInput): Promise<PlanningSnapshot> {
    const values = createGoalSchema.parse(input);
    const snapshot = await getSnapshot();
    const categoryId = resolveOwnedCategoryId(snapshot, values.categoryId);
    const dreamId = resolveOwnedDreamId(snapshot, values.dreamId);
    const timestamp = nowIso();
    const record: GoalRecord = {
      id: createLocalId("goal"),
      categoryId,
      dreamId,
      title: values.title,
      description: values.description ?? null,
      status: "ACTIVE",
      progressType: values.progressType,
      targetDate: values.targetDate ?? null,
      targetValue: values.targetValue ?? null,
      currentValue: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.goals, record);
    return getSnapshot();
  }

  async function updateGoal(input: UpdateGoalInput): Promise<PlanningSnapshot> {
    const values = updateGoalSchema.parse(input);
    const snapshot = await getSnapshot();
    const existing = snapshot.goals.find((item) => item.id === values.id);

    if (!existing) {
      throw new Error("Goal not found.");
    }

    const categoryId = resolveOwnedCategoryId(snapshot, values.categoryId);
    const dreamId = resolveOwnedDreamId(snapshot, values.dreamId);
    const record: GoalRecord = {
      ...existing,
      categoryId,
      dreamId,
      title: values.title,
      description: values.description ?? null,
      progressType: values.progressType,
      targetDate: values.targetDate ?? null,
      targetValue: values.targetValue ?? null,
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.goals, record);
    return getSnapshot();
  }

  async function archiveGoal(id: string): Promise<PlanningSnapshot> {
    const snapshot = await getSnapshot();
    const existing = snapshot.goals.find((item) => item.id === id);

    if (!existing) {
      throw new Error("Goal not found.");
    }

    const record: GoalRecord = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.goals, record);
    return getSnapshot();
  }

  async function saveHabit(input: CreateHabitInput): Promise<PlanningSnapshot> {
    const values = createHabitSchema.parse(input);
    const snapshot = await getSnapshot();
    const goalId = resolveOwnedGoalId(snapshot, values.goalId);
    const timestamp = nowIso();
    const record: HabitRecord = {
      id: createLocalId("habit"),
      goalId,
      title: values.title,
      description: values.description ?? null,
      status: "ACTIVE",
      frequency: values.frequency,
      customDays: values.frequency === "CUSTOM" ? values.customDays ?? null : null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.habits, record);
    return getSnapshot();
  }

  async function updateHabit(input: UpdateHabitInput): Promise<PlanningSnapshot> {
    const values = updateHabitSchema.parse(input);
    const snapshot = await getSnapshot();
    const existing = resolveOwnedHabit(snapshot, values.id);
    const goalId = resolveOwnedGoalId(snapshot, values.goalId);
    const record: HabitRecord = {
      ...existing,
      goalId,
      title: values.title,
      description: values.description ?? null,
      frequency: values.frequency,
      customDays: values.frequency === "CUSTOM" ? values.customDays ?? null : null,
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.habits, record);
    return getSnapshot();
  }

  async function archiveHabit(id: string): Promise<PlanningSnapshot> {
    const snapshot = await getSnapshot();
    const existing = resolveOwnedHabit(snapshot, id);

    const record: HabitRecord = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.habits, record);
    return getSnapshot();
  }

  async function completeHabit(input: CompleteHabitInput): Promise<PlanningSnapshot> {
    const values = completeHabitSchema.parse(input);
    const snapshot = await getSnapshot();
    const habit = resolveOwnedHabit(snapshot, values.habitId);

    if (habit.status === "ARCHIVED") {
      throw new PlanningInputError("Archived habits cannot record new completions right now.");
    }

    const completedFor = values.completedFor ?? getLocalCalendarDateValue();
    const existingCompletion = snapshot.habitCompletions.find((item) => item.habitId === habit.id && item.completedFor === completedFor);

    if (existingCompletion) {
      return snapshot;
    }

    const timestamp = nowIso();
    const record: HabitCompletionRecord = {
      id: createLocalId("habit-completion"),
      habitId: habit.id,
      completedFor,
      completedAt: timestamp,
      createdAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.habitCompletions, record);
    return getSnapshot();
  }

  async function removeHabitCompletion(input: CompleteHabitInput): Promise<PlanningSnapshot> {
    const values = completeHabitSchema.parse(input);
    const snapshot = await getSnapshot();
    const completedFor = values.completedFor ?? getLocalCalendarDateValue();
    const existing = snapshot.habitCompletions.find((item) => item.habitId === values.habitId && item.completedFor === completedFor);

    if (!existing) {
      return snapshot;
    }

    await adapter.remove(buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.habitCompletions, existing.id));
    return getSnapshot();
  }

  async function saveTask(input: CreateTaskInput): Promise<PlanningSnapshot> {
    const values = createTaskSchema.parse(input);
    const snapshot = await getSnapshot();
    const goalId = resolveOwnedGoalId(snapshot, values.goalId);
    const timestamp = nowIso();
    const record: TaskRecord = {
      id: createLocalId("task"),
      goalId,
      title: values.title,
      description: values.description ?? null,
      status: "TODO",
      scheduledFor: values.scheduledFor ?? null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.tasks, record);
    return getSnapshot();
  }

  async function updateTask(input: UpdateTaskInput): Promise<PlanningSnapshot> {
    const values = updateTaskSchema.parse(input);
    const snapshot = await getSnapshot();
    const existing = resolveOwnedTask(snapshot, values.id);
    const goalId = resolveOwnedGoalId(snapshot, values.goalId);
    const record: TaskRecord = {
      ...existing,
      goalId,
      title: values.title,
      description: values.description ?? null,
      scheduledFor: values.scheduledFor ?? null,
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.tasks, record);
    return getSnapshot();
  }

  async function archiveTask(id: string): Promise<PlanningSnapshot> {
    const snapshot = await getSnapshot();
    const existing = resolveOwnedTask(snapshot, id);
    const record: TaskRecord = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: nowIso()
    };

    await writeRecord(adapter, LOCAL_RECORD_NAMESPACES.tasks, record);
    return getSnapshot();
  }

  async function completeTask(input: CompleteTaskInput): Promise<PlanningSnapshot> {
    const values = completeTaskSchema.parse(input);
    const snapshot = await getSnapshot();
    const existing = resolveOwnedTask(snapshot, values.taskId);

    if (existing.status === "ARCHIVED") {
      throw new PlanningInputError("Archived tasks cannot be completed right now.");
    }

    if (existing.status === "DONE") {
      return snapshot;
    }

    const timestamp = nowIso();
    const taskRecord: TaskRecord = {
      ...existing,
      status: "DONE",
      completedAt: timestamp,
      updatedAt: timestamp
    };

    const completionRecord: TaskCompletionRecord = {
      id: createLocalId("task-completion"),
      taskId: existing.id,
      completedAt: timestamp,
      createdAt: timestamp
    };

    await Promise.all([
      writeRecord(adapter, LOCAL_RECORD_NAMESPACES.tasks, taskRecord),
      writeRecord(adapter, LOCAL_RECORD_NAMESPACES.taskCompletions, completionRecord)
    ]);

    return getSnapshot();
  }

  return {
    getSnapshot,
    saveCategory,
    updateCategory,
    archiveCategory,
    saveDream,
    updateDream,
    archiveDream,
    saveGoal,
    updateGoal,
    archiveGoal,
    saveHabit,
    updateHabit,
    archiveHabit,
    completeHabit,
    removeHabitCompletion,
    saveTask,
    updateTask,
    archiveTask,
    completeTask
  };
}

export const localPlanningService = createLocalPlanningService();


