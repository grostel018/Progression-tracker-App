import type { WeeklyReviewWorkspace } from "@/types/weekly-review";

export type WeeklyReviewActionState = WeeklyReviewWorkspace & {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};
