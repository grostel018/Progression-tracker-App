import type { HabitRecord } from "@/types/planning";

export const WEEKDAY_OPTIONS = [
  { value: 0, shortLabel: "Sun", longLabel: "Sunday" },
  { value: 1, shortLabel: "Mon", longLabel: "Monday" },
  { value: 2, shortLabel: "Tue", longLabel: "Tuesday" },
  { value: 3, shortLabel: "Wed", longLabel: "Wednesday" },
  { value: 4, shortLabel: "Thu", longLabel: "Thursday" },
  { value: 5, shortLabel: "Fri", longLabel: "Friday" },
  { value: 6, shortLabel: "Sat", longLabel: "Saturday" }
] as const;

export function getLocalCalendarDateValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayOfWeek(dateValue: string): number {
  return new Date(`${dateValue}T00:00:00`).getDay();
}

export function isHabitScheduledForDate(habit: Pick<HabitRecord, "frequency" | "customDays">, dateValue: string): boolean {
  const dayOfWeek = getDayOfWeek(dateValue);

  switch (habit.frequency) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "WEEKLY":
      return dayOfWeek === 1;
    case "CUSTOM":
      return Array.isArray(habit.customDays) && habit.customDays.includes(dayOfWeek);
    default:
      return false;
  }
}

export function formatHabitFrequency(habit: Pick<HabitRecord, "frequency" | "customDays">): string {
  switch (habit.frequency) {
    case "DAILY":
      return "Daily";
    case "WEEKDAYS":
      return "Weekdays";
    case "WEEKLY":
      return "Weekly";
    case "CUSTOM": {
      const dayLabels = WEEKDAY_OPTIONS.filter((option) => habit.customDays?.includes(option.value)).map((option) => option.shortLabel);

      return dayLabels.length > 0 ? `Custom: ${dayLabels.join(", ")}` : "Custom schedule";
    }
    default:
      return "Custom schedule";
  }
}
