"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localPlanningService } from "@/features/local-mode/planning-storage";
import { buildPlanningActivityInsights, type PlanningActivityInsights } from "@/features/planning/insights";
import { DashboardActivitySection } from "@/features/planning/components/dashboard-activity-section";

export function LocalDashboardActivity(): JSX.Element {
  const [insights, setInsights] = useState<PlanningActivityInsights | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshInsights = useCallback(async (): Promise<void> => {
    try {
      setStatus("loading");
      setErrorMessage(null);

      const snapshot = await localPlanningService.getSnapshot();
      setInsights(buildPlanningActivityInsights(snapshot));
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not read local activity data.");
    }
  }, []);

  useEffect(() => {
    void refreshInsights();
  }, [refreshInsights]);

  if (status === "loading") {
    return (
      <Card className="bg-background-elevated/80">
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="space-y-3 rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4" key={index}>
              <Skeleton className="h-11 w-11 rounded-[1.25rem]" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (status === "error" || !insights) {
    return (
      <Alert title="Could not load local activity" variant="error">
        {errorMessage ?? "The dashboard could not read local activity from this browser."}
      </Alert>
    );
  }

  return (
    <DashboardActivitySection
      description="This lane reads the local planner snapshot directly from IndexedDB, so the dashboard reflects the same habit and task activity the planner already stores on this device."
      insights={insights}
      modeLabel="Local workspace"
      title="The dashboard can finally show what this device has actually seen you do."
      trailingControl={
        <Button onClick={() => void refreshInsights()} size="sm" type="button" variant="ghost">
          <RefreshCcw className="size-4" />
          Refresh
        </Button>
      }
    />
  );
}
