import { z } from "zod";

import { habitFrequencyEnum } from "@/features/planning/schema";

const optionalTrimmedString = z.union([z.string().trim().min(1), z.literal(""), z.undefined()]).transform((value) => (value ? value : undefined));

export const firstStepsSchema = z.object({
  goalTitle: z.string().trim().min(2, "Give your first goal a short title.").max(120, "Keep the goal title under 120 characters."),
  goalDescription: optionalTrimmedString,
  starterKind: z.enum(["habit", "task"]),
  habitTitle: optionalTrimmedString,
  habitDescription: optionalTrimmedString,
  habitFrequency: habitFrequencyEnum.default("DAILY"),
  taskTitle: optionalTrimmedString,
  taskDescription: optionalTrimmedString,
  taskScheduledFor: z.union([z.string(), z.undefined()]).transform((value) => {
    const trimmed = value?.trim() ?? "";

    if (!trimmed) {
      return undefined;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
  })
}).superRefine((value, context) => {
  if (value.starterKind === "habit" && !value.habitTitle) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["habitTitle"],
      message: "Add the first habit that will support this goal."
    });
  }

  if (value.starterKind === "task" && !value.taskTitle) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["taskTitle"],
      message: "Add the first task that will move this goal forward."
    });
  }

  if (value.starterKind === "task" && value.taskScheduledFor && Number.isNaN(new Date(value.taskScheduledFor).getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["taskScheduledFor"],
      message: "Use a valid task date."
    });
  }
});

export type FirstStepsValues = z.infer<typeof firstStepsSchema>;

export function readFirstStepsFormData(formData: FormData): FirstStepsValues {
  return firstStepsSchema.parse({
    goalTitle: formData.get("goalTitle"),
    goalDescription: formData.get("goalDescription") ?? undefined,
    starterKind: formData.get("starterKind"),
    habitTitle: formData.get("habitTitle") ?? undefined,
    habitDescription: formData.get("habitDescription") ?? undefined,
    habitFrequency: formData.get("habitFrequency") ?? "DAILY",
    taskTitle: formData.get("taskTitle") ?? undefined,
    taskDescription: formData.get("taskDescription") ?? undefined,
    taskScheduledFor: formData.get("taskScheduledFor") ?? undefined
  });
}
