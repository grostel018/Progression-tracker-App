import { describe, expect, it } from "vitest";

import { formatHabitFrequency, isHabitScheduledForDate } from "@/features/planning/recurrence";

describe("planning recurrence", () => {
  it("treats weekday habits as due only on weekdays", () => {
    expect(isHabitScheduledForDate({ frequency: "WEEKDAYS", customDays: null }, "2026-04-03")).toBe(true);
    expect(isHabitScheduledForDate({ frequency: "WEEKDAYS", customDays: null }, "2026-04-04")).toBe(false);
  });

  it("formats custom schedules with weekday labels", () => {
    expect(formatHabitFrequency({ frequency: "CUSTOM", customDays: [1, 3, 5] })).toBe("Custom: Mon, Wed, Fri");
  });
});
