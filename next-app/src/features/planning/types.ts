import type { PlanningSnapshot } from "@/types/planning";

export type PlanningActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  snapshot: PlanningSnapshot;
};

export const PLANNING_ACTION_INITIAL_STATE: PlanningActionState = {
  status: "idle",
  snapshot: {
    categories: [],
    dreams: [],
    goals: [],
    goalLogs: [],
    habits: [],
    tasks: [],
    habitCompletions: [],
    taskCompletions: []
  }
};
