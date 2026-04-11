import { getCloudPlanningSnapshot } from "@/features/planning/service";
import type { SaveWeeklyReviewInput, WeeklyReviewWorkspace } from "@/types/weekly-review";

import { WeeklyReviewInputError } from "./errors";
import { buildWeeklyReviewInsights, toWeeklyReviewSummarySnapshot } from "./insights";
import { listWeeklyReviewsForUser, upsertWeeklyReviewRecord } from "./repository";
import { saveWeeklyReviewSchema } from "./schema";

function sortReviewsDesc(left: { weekStart: string; updatedAt: string }, right: { weekStart: string; updatedAt: string }): number {
  return right.weekStart.localeCompare(left.weekStart) || right.updatedAt.localeCompare(left.updatedAt);
}

export async function getCloudWeeklyReviewWorkspace(userId: string): Promise<WeeklyReviewWorkspace> {
  const [snapshot, reviews] = await Promise.all([getCloudPlanningSnapshot(userId), listWeeklyReviewsForUser(userId)]);
  const insights = buildWeeklyReviewInsights(snapshot);
  const recentReviews = [...reviews].sort(sortReviewsDesc).slice(0, 6);

  return {
    insights,
    currentReview: recentReviews.find((review) => review.weekStart === insights.weekStart) ?? null,
    recentReviews
  };
}

export async function saveCloudWeeklyReview(userId: string, input: SaveWeeklyReviewInput): Promise<WeeklyReviewWorkspace> {
  const values = saveWeeklyReviewSchema.parse(input);
  const snapshot = await getCloudPlanningSnapshot(userId);
  const insights = buildWeeklyReviewInsights(snapshot);

  if (values.weekStart !== insights.weekStart) {
    throw new WeeklyReviewInputError("This review is out of date. Reload the page and try again.", {
      weekStart: "Reload the page and try again."
    });
  }

  await upsertWeeklyReviewRecord(userId, values, toWeeklyReviewSummarySnapshot(insights));
  return getCloudWeeklyReviewWorkspace(userId);
}
