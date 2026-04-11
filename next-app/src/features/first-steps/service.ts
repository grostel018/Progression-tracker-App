import { prisma } from "@/lib/db";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";
import { createLocalPlanningService } from "@/features/local-mode/planning-storage";
import { buildLocalRecordKey, LOCAL_RECORD_NAMESPACES } from "@/features/local-mode/storage";
import type { GoalRecord, HabitRecord, PlanningSnapshot, TaskRecord } from "@/types/planning";
import { getCloudPlanningSnapshot } from "@/features/planning/service";

import { firstStepsSchema, type FirstStepsValues } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createCloudStarterSetup(userId: string, input: FirstStepsValues): Promise<PlanningSnapshot> {
  const values = firstStepsSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const goal = await tx.goal.create({
      data: {
        userId,
        title: values.goalTitle,
        description: values.goalDescription ?? null,
        progressType: "BINARY"
      }
    });

    if (values.starterKind === "habit") {
      await tx.habit.create({
        data: {
          userId,
          goalId: goal.id,
          title: values.habitTitle ?? "Starter habit",
          description: values.habitDescription ?? null,
          frequency: values.habitFrequency
        }
      });

      return;
    }

    await tx.task.create({
      data: {
        userId,
        goalId: goal.id,
        title: values.taskTitle ?? "Starter task",
        description: values.taskDescription ?? null,
        scheduledFor: values.taskScheduledFor ? new Date(values.taskScheduledFor) : null
      }
    });
  });

  return getCloudPlanningSnapshot(userId);
}

export async function createLocalStarterSetup(input: FirstStepsValues): Promise<PlanningSnapshot> {
  const values = firstStepsSchema.parse(input);
  const adapter = new IndexedDbStorageAdapter();
  const planningService = createLocalPlanningService(adapter);
  const snapshot = await planningService.getSnapshot();
  const timestamp = nowIso();
  const goalId = createLocalId("goal");
  const goalRecord: GoalRecord = {
    id: goalId,
    title: values.goalTitle,
    description: values.goalDescription ?? null,
    categoryId: null,
    dreamId: null,
    status: "ACTIVE",
    progressType: "BINARY",
    targetDate: null,
    targetValue: null,
    currentValue: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const goalKey = buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goals, goalId);

  const starterRecord: HabitRecord | TaskRecord = values.starterKind === "habit"
    ? {
        id: createLocalId("habit"),
        goalId,
        title: values.habitTitle ?? "Starter habit",
        description: values.habitDescription ?? null,
        status: "ACTIVE",
        frequency: values.habitFrequency,
        customDays: values.habitFrequency === "CUSTOM" ? [] : null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    : {
        id: createLocalId("task"),
        goalId,
        title: values.taskTitle ?? "Starter task",
        description: values.taskDescription ?? null,
        status: "TODO",
        scheduledFor: values.taskScheduledFor ?? null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
  const starterNamespace = values.starterKind === "habit" ? LOCAL_RECORD_NAMESPACES.habits : LOCAL_RECORD_NAMESPACES.tasks;
  const starterKey = buildLocalRecordKey(starterNamespace, starterRecord.id);

  try {
    await Promise.all([
      adapter.write({ key: goalKey, value: goalRecord, updatedAt: timestamp }),
      adapter.write({ key: starterKey, value: starterRecord, updatedAt: timestamp })
    ]);
  } catch (error) {
    await Promise.allSettled([
      adapter.remove(goalKey),
      adapter.remove(starterKey)
    ]);
    throw error;
  }

  return planningService.getSnapshot();
}

export type FirstStepsProgress = {
  needsGoal: boolean;
  needsAction: boolean;
};

export function getStarterProgress(snapshot: PlanningSnapshot): FirstStepsProgress {
  const activeGoalCount = snapshot.goals.filter((item) => item.status !== "ARCHIVED").length;
  const activeHabitCount = snapshot.habits.filter((item) => item.status !== "ARCHIVED").length;
  const activeTaskCount = snapshot.tasks.filter((item) => item.status !== "ARCHIVED").length;

  return {
    needsGoal: activeGoalCount < 1,
    needsAction: activeHabitCount < 1 && activeTaskCount < 1
  };
}
