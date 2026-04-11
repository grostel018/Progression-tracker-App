"use server";

import { ZodError } from "zod";

import { getSession } from "@/lib/auth/session";

import { isWeeklyReviewInputError } from "../errors";
import { saveCloudWeeklyReview } from "../service";
import type { WeeklyReviewActionState } from "../types";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export async function saveWeeklyReviewAction(previousState: WeeklyReviewActionState, formData: FormData): Promise<WeeklyReviewActionState> {
  const session = await getSession();

  if (!session || session.kind !== "cloud") {
    return {
      ...previousState,
      status: "error",
      message: "Sign in to save a cloud weekly review."
    };
  }

  try {
    const workspace = await saveCloudWeeklyReview(session.user.id, {
      weekStart: String(formData.get("weekStart") ?? ""),
      reflection: String(formData.get("reflection") ?? "")
    });

    return {
      ...workspace,
      status: "success",
      message: workspace.currentReview?.reflection ? "Weekly review saved." : "Weekly review saved without a reflection note."
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ...previousState,
        status: "error",
        message: "Tighten the review field and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    if (isWeeklyReviewInputError(error)) {
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
      message: "Could not save this weekly review right now."
    };
  }
}
