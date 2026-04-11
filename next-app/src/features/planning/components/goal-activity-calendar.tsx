"use client";

import { cn } from "@/lib/utils";

export type GoalActivityCalendarCell = {
  date: string;
  count: number;
};

function groupIntoWeeks(cells: GoalActivityCalendarCell[]): GoalActivityCalendarCell[][] {
  const weeks: GoalActivityCalendarCell[][] = [];

  cells.forEach((cell, index) => {
    const weekIndex = Math.floor(index / 7);

    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }

    weeks[weekIndex].push(cell);
  });

  return weeks;
}

function getIntensity(count: number, maxCount: number): string {
  if (count <= 0 || maxCount <= 0) {
    return "bg-[var(--color-surface-muted)] border-border-subtle";
  }

  const ratio = count / maxCount;

  if (ratio < 0.34) {
    return "border-primary/20 bg-primary/20";
  }

  if (ratio < 0.67) {
    return "border-primary/30 bg-primary/35";
  }

  return "border-primary/45 bg-primary/55";
}

export function GoalActivityCalendar({
  cells,
  className
}: {
  cells: GoalActivityCalendarCell[];
  className?: string;
}): JSX.Element {
  const weeks = groupIntoWeeks(cells);
  const maxCount = cells.reduce((max, cell) => Math.max(max, cell.count), 0);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="inline-flex gap-1.5 rounded-[1.35rem] border border-border-subtle bg-[var(--color-surface-muted)]/55 p-3">
        {weeks.map((week, weekIndex) => (
          <div className="grid grid-rows-7 gap-1.5" key={`week-${weekIndex}`}>
            {week.map((cell) => (
              <div
                aria-label={`${cell.date}: ${cell.count} tracked event${cell.count === 1 ? "" : "s"}`}
                className={cn(
                  "size-4 rounded-[0.45rem] border transition-colors sm:size-4.5",
                  getIntensity(cell.count, maxCount)
                )}
                key={cell.date}
                title={`${cell.date}: ${cell.count} tracked event${cell.count === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
