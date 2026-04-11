import type { ZodType } from "zod";

import { goalLogRecordSchema, goalRecordSchema, planningSnapshotSchema } from "@/features/planning/schema";
import { PlanningInputError } from "@/features/planning/errors";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type {
  CreateGoalLogInput,
  DeleteGoalLogInput,
  GoalLogRecord,
  GoalRecord,
  PlanningSnapshot,
  UpdateGoalLogInput
} from "@/types/planning";

import { buildLocalRecordKey, LOCAL_RECORD_NAMESPACES } from "./storage";
import { createLocalPlanningService } from "./planning-storage";

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

function normalizeLoggedAt(value?: string): string {
  if (!value?.trim()) {
    return nowIso();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`).toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new PlanningInputError("Use a valid log date.", {
      loggedAt: "Use a valid log date."
    });
  }

  return parsed.toISOString();
}

function validateProgressValue(goal: GoalRecord, progressValue: number): void {
  if (goal.progressType === "BINARY" && ![0, 1].includes(progressValue)) {
    throw new PlanningInputError("Binary goals only accept 0 or 1.", {
      progressValue: "Use 0 for not complete or 1 for complete."
    });
  }

  if (goal.progressType === "PERCENT" && (progressValue < 0 || progressValue > 100)) {
    throw new PlanningInputError("Percent goals must stay between 0 and 100.", {
      progressValue: "Use a percentage between 0 and 100."
    });
  }

  if (goal.progressType === "TARGET_COUNT" && progressValue < 0) {
    throw new PlanningInputError("Count-based goals cannot go below zero.", {
      progressValue: "Use zero or a positive count."
    });
  }
}

async function getGoalLogs(adapter: StorageAdapter): Promise<GoalLogRecord[]> {
  return readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goalLogs, ""), goalLogRecordSchema);
}

async function getOwnedGoal(snapshot: PlanningSnapshot, goalId: string): Promise<GoalRecord> {
  const goal = snapshot.goals.find((item) => item.id === goalId);

  if (!goal) {
    throw new PlanningInputError("Choose a goal from this device workspace.", {
      goalId: "Choose a goal from this device workspace."
    });
  }

  return goal;
}

async function writeGoal(adapter: StorageAdapter, record: GoalRecord): Promise<void> {
  const parsed = goalRecordSchema.parse(record);
  await adapter.write({
    key: buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goals, parsed.id),
    value: parsed,
    updatedAt: parsed.updatedAt
  });
}

async function writeGoalLog(adapter: StorageAdapter, record: GoalLogRecord): Promise<void> {
  const parsed = goalLogRecordSchema.parse(record);
  await adapter.write({
    key: buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goalLogs, parsed.id),
    value: parsed,
    updatedAt: parsed.updatedAt
  });
}

async function syncGoalCurrentValue(adapter: StorageAdapter, snapshot: PlanningSnapshot, goalId: string): Promise<void> {
  const goal = snapshot.goals.find((item) => item.id === goalId);

  if (!goal) {
    return;
  }

  const logs = (await getGoalLogs(adapter))
    .filter((item) => item.goalId === goalId)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt) || right.updatedAt.localeCompare(left.updatedAt));

  await writeGoal(adapter, {
    ...goal,
    currentValue: logs[0]?.progressValue ?? 0,
    updatedAt: nowIso()
  });
}

export function createLocalGoalProgressService(adapter: StorageAdapter = new IndexedDbStorageAdapter()) {
  const planningService = createLocalPlanningService(adapter);

  async function saveGoalLog(input: CreateGoalLogInput | UpdateGoalLogInput): Promise<PlanningSnapshot> {
    const snapshot = await planningService.getSnapshot();
    const goal = await getOwnedGoal(snapshot, input.goalId);
    validateProgressValue(goal, input.progressValue);
    const timestamp = nowIso();
    const existingLog = "id" in input ? (snapshot.goalLogs ?? []).find((item) => item.id === input.id && item.goalId === input.goalId) : null;

    if ("id" in input && !existingLog) {
      throw new Error("Goal log not found.");
    }

    const record: GoalLogRecord = {
      id: existingLog?.id ?? createLocalId("goal-log"),
      goalId: goal.id,
      loggedAt: normalizeLoggedAt(input.loggedAt),
      progressValue: input.progressValue,
      note: input.note?.trim() ? input.note.trim() : null,
      createdAt: existingLog?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    await writeGoalLog(adapter, record);
    await syncGoalCurrentValue(adapter, snapshot, goal.id);
    return planningSnapshotSchema.parse(await planningService.getSnapshot());
  }

  async function deleteGoalLog(input: DeleteGoalLogInput): Promise<PlanningSnapshot> {
    const snapshot = await planningService.getSnapshot();
    await getOwnedGoal(snapshot, input.goalId);

    await adapter.remove(buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.goalLogs, input.id));
    await syncGoalCurrentValue(adapter, snapshot, input.goalId);
    return planningSnapshotSchema.parse(await planningService.getSnapshot());
  }

  return {
    saveGoalLog,
    deleteGoalLog
  };
}

export const localGoalProgressService = createLocalGoalProgressService();
