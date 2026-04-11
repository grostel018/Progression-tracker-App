import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlannerSectionCardProps = {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  sectionId?: string;
  className?: string;
  headerSlot?: ReactNode;
};

export function PlannerSectionCard({
  kicker,
  title,
  description,
  children,
  sectionId,
  className,
  headerSlot
}: PlannerSectionCardProps): JSX.Element {
  return (
    <section className={cn("scroll-mt-24 space-y-6", className)} id={sectionId}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border-subtle pt-6">
        <div className="max-w-3xl space-y-3">
          <Badge variant="muted">{kicker}</Badge>
          <div className="space-y-2">
            <h2 className="text-[1.85rem] leading-[1.1] text-foreground sm:text-[2.2rem] font-semibold tracking-tight">{title}</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-[0.98rem]">{description}</p>
          </div>
        </div>
        {headerSlot ? <div className="shrink-0">{headerSlot}</div> : null}
      </div>

      <Card className="bg-background-elevated/80 shadow-lg shadow-black/5 backdrop-blur-md hover:shadow-xl hover:shadow-black/10 transition-shadow duration-300">
        <CardContent className="space-y-6 pt-7 sm:pt-8">{children}</CardContent>
      </Card>
    </section>
  );
}
