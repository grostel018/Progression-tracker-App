import { describe, expect, it } from "vitest";

import { firstStepsSchema } from "@/features/first-steps/schema";

describe("first steps schema", () => {
  it("requires a first habit title when the starter kind is habit", () => {
    const result = firstStepsSchema.safeParse({
      goalTitle: "Build momentum",
      starterKind: "habit",
      habitTitle: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.habitTitle?.[0]).toContain("first habit");
  });

  it("requires a first task title when the starter kind is task", () => {
    const result = firstStepsSchema.safeParse({
      goalTitle: "Build momentum",
      starterKind: "task",
      taskTitle: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.taskTitle?.[0]).toContain("first task");
  });

  it("accepts a valid starter goal plus first habit", () => {
    const result = firstStepsSchema.safeParse({
      goalTitle: "Train three times this week",
      starterKind: "habit",
      habitTitle: "Workout",
      habitFrequency: "DAILY"
    });

    expect(result.success).toBe(true);
  });
});
