import { Compass, Goal, LayoutGrid, ListChecks, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlanningSnapshot } from "@/types/planning";

type PlannerOverviewProps = {
  snapshot: PlanningSnapshot;
  modeLabel: string;
};

const cards = [
  { key: "categories", label: "Categories", icon: LayoutGrid },
  { key: "dreams", label: "Dreams", icon: Compass },
  { key: "goals", label: "Goals", icon: Goal },
  { key: "habits", label: "Habits", icon: Repeat },
  { key: "tasks", label: "Tasks", icon: ListChecks }
] as const;

export function PlannerOverview({ snapshot, modeLabel }: PlannerOverviewProps): JSX.Element {
  const actionRecordCount = snapshot.habitCompletions.length + snapshot.taskCompletions.length;
  const summary = `${snapshot.categories.length} categories, ${snapshot.dreams.length} dreams, ${snapshot.goals.length} goals, ${snapshot.habits.length} habits, ${snapshot.tasks.length} tasks, ${actionRecordCount} action records.`;

  return (
    <section className="space-y-7 border-b border-border-subtle pb-7">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)] xl:items-center">
        <div className="space-y-4">
          <Badge variant="primary">Planner workspace</Badge>
          <div className="space-y-4">
            <h1 className="max-w-[16ch] text-4xl leading-[0.96] sm:text-5xl font-bold tracking-tight text-foreground">Build the plan, then keep execution close to the goal.</h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              {summary} The {modeLabel.toLowerCase()} planner keeps goals, habits, tasks, dreams, and categories on one canvas so the flow stays easy to scan.
            </p>
          </div>
        </div>

        <Card className="bg-background-elevated/85 p-6 shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              const count = snapshot[card.key].length;

              return (
                <div className="hover-glow rounded-[1.3rem] border border-border-subtle bg-background/70 px-4 py-4 transition-all duration-300" key={card.key}>
                  <div className="flex items-center gap-2 text-muted">
                    <Icon className="size-4 text-primary" />
                    <p className="text-[0.72rem] uppercase tracking-[0.18em]">{card.label}</p>
                  </div>
                  <p className="mt-3 text-3xl font-bold leading-none text-foreground">{count}</p>
                </div>
              );
            })}
            <div className="hover-glow rounded-[1.3rem] border border-primary/24 bg-primary/12 px-4 py-4 sm:col-span-2 xl:col-span-2 transition-all duration-300">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-primary/80">Recorded proof</p>
              <p className="mt-3 text-3xl font-bold leading-none text-foreground">{actionRecordCount}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Habit actions and completed tasks already captured in this workspace.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
