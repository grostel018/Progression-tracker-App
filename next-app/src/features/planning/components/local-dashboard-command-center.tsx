"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { localPlanningService } from "@/features/local-mode/planning-storage";
import { DashboardCommandCenter } from "@/features/planning/components/dashboard-command-center";
import type { PlanningSnapshot } from "@/types/planning";

const EMPTY_SNAPSHOT: PlanningSnapshot = {
  categories: [],
  dreams: [],
  goals: [],
  goalLogs: [],
  habits: [],
  tasks: [],
  habitCompletions: [],
  taskCompletions: []
};

export function LocalDashboardCommandCenter(): JSX.Element {
  const [snapshot, setSnapshot] = useState<PlanningSnapshot>(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadSnapshot = useCallback(async (): Promise<void> => {
    try {
      setStatus("loading");
      const nextSnapshot = await localPlanningService.getSnapshot();
      setSnapshot(nextSnapshot);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  if (status === "error") {
    return (
      <Alert title="Could not load local dashboard" variant="error">
        The command center could not read planner history from this browser.
      </Alert>
    );
  }

  if (status === "loading") {
    return (
      <Alert title="Loading local dashboard" variant="info">
        Reading this browser&apos;s planner and progress history.
      </Alert>
    );
  }

  return <DashboardCommandCenter isLocalMode snapshot={snapshot} />;
}
