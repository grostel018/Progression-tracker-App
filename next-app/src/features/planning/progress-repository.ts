import { prisma } from "@/lib/db";
import type { CreateGoalLogInput, DeleteGoalLogInput, GoalLogRecord, GoalProgressType, UpdateGoalLogInput } from "@/types/planning";

import { PlanningInputError } from "./errors";

function serializeGoalLog(log: {
  id: string;
  goalId: string;
  loggedAt: Date;
  progressValue: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GoalLogRecord {
  return {
    id: log.id,
    goalId: log.goalId,
    loggedAt: log.loggedAt.toISOString(),
    progressValue: log.progressValue,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString()
  };
}

async function getOwnedGoal(userId: string, goalId: string): Promise<{ id: string; progressType: GoalProgressType; targetValue: number | null }> {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true, progressType: true, targetValue: true }
  });

  if (!goal) {
    throw new PlanningInputError("Choose a goal from your workspace.", {
      goalId: "Choose a goal from your workspace."
    });
  }

  return {
    id: goal.id,
    progressType: goal.progressType as GoalProgressType,
    targetValue: goal.targetValue
  };
}

function validateProgressValue(goal: { progressType: GoalProgressType; targetValue: number | null }, progressValue: number): void {
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

async function syncGoalCurrentValue(goalId: string): Promise<void> {
  const latestLog = await prisma.goalLog.findFirst({
    where: { goalId },
    orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }],
    select: { progressValue: true }
  });

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      currentValue: latestLog?.progressValue ?? 0
    }
  });
}

export async function getGoalLogsForUser(userId: string): Promise<GoalLogRecord[]> {
  const logs = await prisma.goalLog.findMany({
    where: { goal: { userId } },
    orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }]
  });

  return logs.map(serializeGoalLog);
}

export async function createGoalLogRecord(userId: string, input: CreateGoalLogInput): Promise<void> {
  const goal = await getOwnedGoal(userId, input.goalId);
  validateProgressValue(goal, input.progressValue);

  await prisma.goalLog.create({
    data: {
      goalId: goal.id,
      loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
      progressValue: input.progressValue,
      note: input.note ?? null
    }
  });

  await syncGoalCurrentValue(goal.id);
}

export async function updateGoalLogRecord(userId: string, input: UpdateGoalLogInput): Promise<void> {
  const goal = await getOwnedGoal(userId, input.goalId);
  validateProgressValue(goal, input.progressValue);

  const result = await prisma.goalLog.updateMany({
    where: {
      id: input.id,
      goalId: goal.id,
      goal: { userId }
    },
    data: {
      loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
      progressValue: input.progressValue,
      note: input.note ?? null
    }
  });

  if (result.count === 0) {
    throw new Error("Goal log not found.");
  }

  await syncGoalCurrentValue(goal.id);
}

export async function deleteGoalLogRecord(userId: string, input: DeleteGoalLogInput): Promise<void> {
  const goal = await getOwnedGoal(userId, input.goalId);

  await prisma.goalLog.deleteMany({
    where: {
      id: input.id,
      goalId: goal.id,
      goal: { userId }
    }
  });

  await syncGoalCurrentValue(goal.id);
}
