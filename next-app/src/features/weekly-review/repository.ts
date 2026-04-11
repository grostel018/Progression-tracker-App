import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { SaveWeeklyReviewInput, WeeklyReviewRecord, WeeklyReviewSummarySnapshot } from "@/types/weekly-review";

const prismaWithWeeklyReviews = prisma as typeof prisma & {
  weeklyReview: any;
};

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function serializeWeeklyReview(review: {
  id: string;
  reviewWeekStart: Date;
  reviewWeekEnd: Date;
  reflection: string | null;
  summarySnapshot: Prisma.JsonValue | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WeeklyReviewRecord {
  return {
    id: review.id,
    weekStart: toCalendarDate(review.reviewWeekStart),
    weekEnd: toCalendarDate(review.reviewWeekEnd),
    reflection: review.reflection,
    summarySnapshot: (review.summarySnapshot ?? {}) as WeeklyReviewSummarySnapshot,
    completedAt: (review.completedAt ?? review.updatedAt).toISOString(),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  };
}

export async function listWeeklyReviewsForUser(userId: string): Promise<WeeklyReviewRecord[]> {
  const reviews = await prismaWithWeeklyReviews.weeklyReview.findMany({
    where: { userId },
    orderBy: [{ reviewWeekStart: "desc" }, { updatedAt: "desc" }]
  });

  return reviews.map(serializeWeeklyReview);
}

export async function upsertWeeklyReviewRecord(
  userId: string,
  input: SaveWeeklyReviewInput,
  summarySnapshot: WeeklyReviewSummarySnapshot
): Promise<WeeklyReviewRecord> {
  const weekStart = new Date(`${summarySnapshot.weekStart}T00:00:00.000Z`);
  const weekEnd = new Date(`${summarySnapshot.weekEnd}T00:00:00.000Z`);
  const existing = await prismaWithWeeklyReviews.weeklyReview.findFirst({
    where: {
      userId,
      reviewWeekStart: weekStart
    }
  });

  if (existing) {
    const updated = await prismaWithWeeklyReviews.weeklyReview.update({
      where: { id: existing.id },
      data: {
        reviewWeekEnd: weekEnd,
        reflection: input.reflection ?? null,
        summarySnapshot: summarySnapshot as Prisma.InputJsonValue,
        completedAt: existing.completedAt ?? new Date()
      }
    });

    return serializeWeeklyReview(updated);
  }

  const created = await prismaWithWeeklyReviews.weeklyReview.create({
    data: {
      userId,
      reviewWeekStart: weekStart,
      reviewWeekEnd: weekEnd,
      reflection: input.reflection ?? null,
      summarySnapshot: summarySnapshot as Prisma.InputJsonValue,
      completedAt: new Date()
    }
  });

  return serializeWeeklyReview(created);
}
