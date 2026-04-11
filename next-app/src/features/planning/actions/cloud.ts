"use server";

import { ZodError } from "zod";

import { getSession } from "@/lib/auth/session";

import type { PlanningActionState } from "../types";
import { isPlanningInputError } from "../errors";
import {
  archiveCategory,
  archiveDream,
  archiveGoal,
  archiveHabit,
  archiveTask,
  completeHabit,
  completeTask,
  createCategory,
  createDream,
  createGoal,
  createGoalLog,
  createHabit,
  createTask,
  deleteGoalLog,
  removeHabitCompletion,
  updateCategory,
  updateDream,
  updateGoal,
  updateGoalLog,
  updateHabit,
  updateTask
} from "../service";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function buildErrorState(previousState: PlanningActionState, error: unknown, fallbackMessage: string): PlanningActionState {
  if (error instanceof ZodError) {
    return {
      ...previousState,
      status: "error",
      message: "Fix the highlighted field.",
      fieldErrors: flattenFieldErrors(error)
    };
  }

  if (isPlanningInputError(error)) {
    return {
      ...previousState,
      status: "error",
      message: error.message,
      fieldErrors: error.fieldErrors
    };
  }

  return {
    ...previousState,
    status: "error",
    message: fallbackMessage
  };
}

async function requireCloudUser(previousState: PlanningActionState): Promise<{ userId: string } | PlanningActionState> {
  const session = await getSession();

  if (!session || session.kind !== "cloud") {
    return {
      ...previousState,
      status: "error",
      message: "Sign in to use the cloud planner."
    };
  }

  return { userId: session.user.id };
}

function readCustomDays(formData: FormData): number[] {
  return formData
    .getAll("customDays")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

export async function saveCategoryAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();

  try {
    const snapshot = id
      ? await updateCategory(required.userId, {
          id,
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? "")
        })
      : await createCategory(required.userId, {
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? "")
        });

    return {
      status: "success",
      message: id ? "Category updated." : "Category added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that category right now." : "Could not save that category right now.");
  }
}

export async function archiveCategoryAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await archiveCategory(required.userId, String(formData.get("id") ?? ""));

    return {
      status: "success",
      message: "Category archived.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not archive that category right now.");
  }
}

export async function saveDreamAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();

  try {
    const snapshot = id
      ? await updateDream(required.userId, {
          id,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          vision: String(formData.get("vision") ?? ""),
          categoryId: String(formData.get("categoryId") ?? ""),
          targetDate: String(formData.get("targetDate") ?? "")
        })
      : await createDream(required.userId, {
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          vision: String(formData.get("vision") ?? ""),
          categoryId: String(formData.get("categoryId") ?? ""),
          targetDate: String(formData.get("targetDate") ?? "")
        });

    return {
      status: "success",
      message: id ? "Dream updated." : "Dream added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that dream right now." : "Could not save that dream right now.");
  }
}

export async function archiveDreamAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await archiveDream(required.userId, String(formData.get("id") ?? ""));

    return {
      status: "success",
      message: "Dream archived.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not archive that dream right now.");
  }
}

export async function saveGoalAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();
  const targetValueInput = String(formData.get("targetValue") ?? "");

  try {
    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      dreamId: String(formData.get("dreamId") ?? ""),
      progressType: String(formData.get("progressType") ?? "BINARY") as "BINARY" | "PERCENT" | "TARGET_COUNT",
      targetDate: String(formData.get("targetDate") ?? ""),
      targetValue: targetValueInput ? Number(targetValueInput) : null
    };

    const snapshot = id
      ? await updateGoal(required.userId, { id, ...payload })
      : await createGoal(required.userId, payload);

    return {
      status: "success",
      message: id ? "Goal updated." : "Goal added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that goal right now." : "Could not save that goal right now.");
  }
}

export async function archiveGoalAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await archiveGoal(required.userId, String(formData.get("id") ?? ""));

    return {
      status: "success",
      message: "Goal archived.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not archive that goal right now.");
  }
}

export async function saveHabitAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    goalId: String(formData.get("goalId") ?? ""),
    frequency: String(formData.get("frequency") ?? "DAILY") as "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM",
    customDays: readCustomDays(formData)
  };

  try {
    const snapshot = id ? await updateHabit(required.userId, { id, ...payload }) : await createHabit(required.userId, payload);

    return {
      status: "success",
      message: id ? "Habit updated." : "Habit added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that habit right now." : "Could not save that habit right now.");
  }
}

export async function archiveHabitAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await archiveHabit(required.userId, String(formData.get("id") ?? ""));

    return {
      status: "success",
      message: "Habit archived.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not archive that habit right now.");
  }
}

export async function completeHabitAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await completeHabit(required.userId, {
      habitId: String(formData.get("habitId") ?? ""),
      completedFor: String(formData.get("completedFor") ?? "")
    });

    return {
      status: "success",
      message: "Habit completion recorded.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not record that habit completion right now.");
  }
}

export async function removeHabitCompletionAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await removeHabitCompletion(required.userId, {
      habitId: String(formData.get("habitId") ?? ""),
      completedFor: String(formData.get("completedFor") ?? "")
    });

    return {
      status: "success",
      message: "Habit completion removed.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not remove that habit completion right now.");
  }
}

export async function saveTaskAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    goalId: String(formData.get("goalId") ?? ""),
    scheduledFor: String(formData.get("scheduledFor") ?? "")
  };

  try {
    const snapshot = id ? await updateTask(required.userId, { id, ...payload }) : await createTask(required.userId, payload);

    return {
      status: "success",
      message: id ? "Task updated." : "Task added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that task right now." : "Could not save that task right now.");
  }
}

export async function archiveTaskAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await archiveTask(required.userId, String(formData.get("id") ?? ""));

    return {
      status: "success",
      message: "Task archived.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not archive that task right now.");
  }
}

export async function completeTaskAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await completeTask(required.userId, {
      taskId: String(formData.get("taskId") ?? "")
    });

    return {
      status: "success",
      message: "Task completed.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not complete that task right now.");
  }
}

export const createDreamAction = saveDreamAction;
export const createGoalAction = saveGoalAction;
export const createHabitAction = saveHabitAction;
export const createTaskAction = saveTaskAction;

export async function saveGoalLogAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  const id = String(formData.get("id") ?? "").trim();
  const progressValue = Number(String(formData.get("progressValue") ?? "0"));
  const payload = {
    goalId: String(formData.get("goalId") ?? ""),
    loggedAt: String(formData.get("loggedAt") ?? ""),
    progressValue,
    note: String(formData.get("note") ?? "")
  };

  try {
    const snapshot = id
      ? await updateGoalLog(required.userId, { id, ...payload })
      : await createGoalLog(required.userId, payload);

    return {
      status: "success",
      message: id ? "Progress entry updated." : "Progress entry added.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, id ? "Could not update that progress entry right now." : "Could not save that progress entry right now.");
  }
}

export async function deleteGoalLogAction(previousState: PlanningActionState, formData: FormData): Promise<PlanningActionState> {
  const required = await requireCloudUser(previousState);
  if ("status" in required) {
    return required;
  }

  try {
    const snapshot = await deleteGoalLog(required.userId, {
      id: String(formData.get("id") ?? ""),
      goalId: String(formData.get("goalId") ?? "")
    });

    return {
      status: "success",
      message: "Progress entry removed.",
      snapshot
    };
  } catch (error) {
    return buildErrorState(previousState, error, "Could not remove that progress entry right now.");
  }
}

