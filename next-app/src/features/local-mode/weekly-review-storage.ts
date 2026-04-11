import type { ZodType } from "zod";

import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";
import type { StorageAdapter } from "@/lib/storage/adapter";
import type { SaveWeeklyReviewInput, WeeklyReviewRecord, WeeklyReviewWorkspace } from "@/types/weekly-review";

import { WeeklyReviewInputError } from "@/features/weekly-review/errors";
import { buildWeeklyReviewInsights, toWeeklyReviewSummarySnapshot } from "@/features/weekly-review/insights";
import { saveWeeklyReviewSchema, weeklyReviewRecordSchema } from "@/features/weekly-review/schema";

import { createLocalPlanningService } from "./planning-storage";
import { buildLocalRecordKey, LOCAL_RECORD_NAMESPACES } from "./storage";

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readParsedRecords<TValue>(adapter: StorageAdapter, prefix: string, parser: ZodType<TValue>): Promise<TValue[]> {
  const keys = await adapter.listKeys(prefix);
  const records = await Promise.all(keys.map((key) => adapter.read<unknown>(key)));

  return records.flatMap((record) => {
    if (!record?.value) {
      return [];
    }

    const parsed = parser.safeParse(record.value);
    return parsed.success ? [parsed.data] : [];
  });
}

async function writeRecord(adapter: StorageAdapter, record: WeeklyReviewRecord): Promise<void> {
  await adapter.write({
    key: buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.weeklyReviews, record.id),
    value: record,
    updatedAt: record.updatedAt
  });
}

function sortReviewsDesc(left: WeeklyReviewRecord, right: WeeklyReviewRecord): number {
  return right.weekStart.localeCompare(left.weekStart) || right.updatedAt.localeCompare(left.updatedAt);
}

export function createLocalWeeklyReviewService(adapter: StorageAdapter = new IndexedDbStorageAdapter()) {
  const planningService = createLocalPlanningService(adapter);

  async function listReviews(): Promise<WeeklyReviewRecord[]> {
    const available = await adapter.isAvailable();

    if (!available) {
      return [];
    }

    const reviews = await readParsedRecords(adapter, buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.weeklyReviews, ""), weeklyReviewRecordSchema);
    return reviews.sort(sortReviewsDesc);
  }

  async function getWorkspace(): Promise<WeeklyReviewWorkspace> {
    const [snapshot, reviews] = await Promise.all([planningService.getSnapshot(), listReviews()]);
    const insights = buildWeeklyReviewInsights(snapshot);

    return {
      insights,
      currentReview: reviews.find((review) => review.weekStart === insights.weekStart) ?? null,
      recentReviews: reviews.slice(0, 6)
    };
  }

  async function saveReview(input: SaveWeeklyReviewInput): Promise<WeeklyReviewWorkspace> {
    const values = saveWeeklyReviewSchema.parse(input);
    const snapshot = await planningService.getSnapshot();
    const insights = buildWeeklyReviewInsights(snapshot);

    if (values.weekStart !== insights.weekStart) {
      throw new WeeklyReviewInputError("This review is out of date. Reload the page and try again.", {
        weekStart: "Reload the page and try again."
      });
    }

    const existingReviews = await listReviews();
    const existing = existingReviews.find((review) => review.weekStart === insights.weekStart);
    const timestamp = nowIso();
    const record = weeklyReviewRecordSchema.parse({
      id: existing?.id ?? createLocalId("weekly-review"),
      weekStart: insights.weekStart,
      weekEnd: insights.weekEnd,
      reflection: values.reflection ?? null,
      summarySnapshot: toWeeklyReviewSummarySnapshot(insights),
      completedAt: existing?.completedAt ?? timestamp,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    });

    await writeRecord(adapter, record);
    return getWorkspace();
  }

  return {
    listReviews,
    getWorkspace,
    saveReview
  };
}

export const localWeeklyReviewService = createLocalWeeklyReviewService();
