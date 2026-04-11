"use server";

import { ZodError } from "zod";

import { getAccessContext } from "@/lib/auth/session";
import type { PlanningSnapshot } from "@/types/planning";

import { readFirstStepsFormData } from "./schema";
import { createCloudStarterSetup } from "./service";

export type FirstStepsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  snapshot?: PlanningSnapshot;
};


function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export async function saveCloudFirstStepsAction(_previousState: FirstStepsActionState, formData: FormData): Promise<FirstStepsActionState> {
  try {
    const access = await getAccessContext();

    if (!access.cloudUser?.id) {
      return {
        status: "error",
        message: "Sign in to finish your first setup steps."
      };
    }

    const values = readFirstStepsFormData(formData);
    const snapshot = await createCloudStarterSetup(access.cloudUser.id, values);

    return {
      status: "success",
      message: "Your first goal and starter action are ready.",
      snapshot
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "We could not save your first setup steps right now."
    };
  }
}



