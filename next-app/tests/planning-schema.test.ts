import { describe, expect, it } from "vitest";

import { completeHabitSchema, createCategorySchema, createDreamSchema, createGoalSchema, createHabitSchema, createTaskSchema } from "@/features/planning/schema";

describe("planning schema", () => {
  it("accepts a valid category with trimmed optional description", () => {
    const result = createCategorySchema.safeParse({
      name: "  Health  ",
      description: "  Energy and fitness  "
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Health");
      expect(result.data.description).toBe("Energy and fitness");
    }
  });

  it("accepts a valid goal with optional linked dream and category", () => {
    const result = createGoalSchema.safeParse({
      title: "Lose 20 kilos",
      categoryId: "category-1",
      dreamId: "dream-1",
      progressType: "TARGET_COUNT",
      targetValue: "20",
      targetDate: "2026-06-01T08:00"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetValue).toBe(20);
      expect(result.data.categoryId).toBe("category-1");
      expect(result.data.dreamId).toBe("dream-1");
      expect(result.data.targetDate).toMatch(/T/);
      expect(result.data.targetDate).toMatch(/Z$/);
    }
  });

  it("normalizes blank optional dream fields instead of forcing fake relationships", () => {
    const result = createDreamSchema.safeParse({
      title: "Healthy body",
      description: "",
      vision: "",
      categoryId: "",
      targetDate: ""
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.vision).toBeUndefined();
      expect(result.data.categoryId).toBeUndefined();
      expect(result.data.targetDate).toBeUndefined();
    }
  });

  it("rejects malformed date-time input instead of silently accepting it", () => {
    const result = createTaskSchema.safeParse({
      title: "Drink water",
      goalId: "",
      scheduledFor: "not-a-date"
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one weekday for custom habits", () => {
    const result = createHabitSchema.safeParse({
      title: "Stretch",
      frequency: "CUSTOM",
      customDays: []
    });

    expect(result.success).toBe(false);
  });

  it("accepts habit completion input with a plain calendar date", () => {
    const result = completeHabitSchema.safeParse({
      habitId: "habit-1",
      completedFor: "2026-04-04"
    });

    expect(result.success).toBe(true);
  });
});
