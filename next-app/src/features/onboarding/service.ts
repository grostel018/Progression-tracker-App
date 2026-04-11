import type { LocalOnboardingAnswers, OnboardingStepId } from "@/types/onboarding";
import { isOnboardingStepId } from "@/types/onboarding";

import { getFirstIncompleteStep, getNextOnboardingStep, localOnboardingAnswersSchema, type OnboardingStepFormValues } from "./schema";
import { getOnboardingPreferenceByUserId, type OnboardingPreferenceRecord, upsertOnboardingPreference } from "./repository";

export type OnboardingSnapshot = Omit<LocalOnboardingAnswers, "id" | "version" | "updatedAt">;

type OnboardingSnapshotInput = {
  motivationStyle?: string;
  focusArea?: string;
  dailyCommitmentMinutes?: number;
  primaryObstacle?: string;
  ninetyDayVision?: string;
  completedStepIds?: OnboardingStepId[];
  completedAt?: string;
};

function normalizeCompletedStepIds(value: unknown): OnboardingStepId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is OnboardingStepId => typeof item === "string" && isOnboardingStepId(item));
}

function buildLocalLikeSnapshot(snapshot: OnboardingSnapshotInput): LocalOnboardingAnswers {
  return localOnboardingAnswersSchema.parse({
    id: "default",
    version: 1,
    motivationStyle: snapshot.motivationStyle,
    focusArea: snapshot.focusArea,
    dailyCommitmentMinutes: snapshot.dailyCommitmentMinutes,
    primaryObstacle: snapshot.primaryObstacle,
    ninetyDayVision: snapshot.ninetyDayVision,
    completedStepIds: snapshot.completedStepIds ?? [],
    completedAt: snapshot.completedAt,
    updatedAt: new Date().toISOString()
  });
}

function mapPreferenceRecord(record: OnboardingPreferenceRecord | null): OnboardingSnapshot {
  const normalized = buildLocalLikeSnapshot({
    motivationStyle: record?.motivationStyle ?? undefined,
    focusArea: record?.focusArea ?? undefined,
    dailyCommitmentMinutes: record?.dailyCommitmentMinutes ?? undefined,
    primaryObstacle: record?.primaryObstacle ?? undefined,
    ninetyDayVision: record?.ninetyDayVision ?? undefined,
    completedStepIds: normalizeCompletedStepIds(record?.completedStepIds),
    completedAt: record?.onboardingCompletedAt?.toISOString()
  });

  return {
    motivationStyle: normalized.motivationStyle,
    focusArea: normalized.focusArea,
    dailyCommitmentMinutes: normalized.dailyCommitmentMinutes,
    primaryObstacle: normalized.primaryObstacle,
    ninetyDayVision: normalized.ninetyDayVision,
    completedStepIds: normalized.completedStepIds,
    completedAt: normalized.completedAt
  };
}

export async function getCloudOnboardingState(userId: string): Promise<OnboardingSnapshot> {
  const record = await getOnboardingPreferenceByUserId(userId);
  return mapPreferenceRecord(record);
}

export async function saveCloudOnboardingStep(userId: string, values: OnboardingStepFormValues): Promise<{
  answers: OnboardingSnapshot;
  completed: boolean;
  nextStep: OnboardingStepId | null;
}> {
  const current = await getCloudOnboardingState(userId);
  const completedStepIds = Array.from(new Set([...current.completedStepIds, values.stepId]));

  const nextSnapshot = buildLocalLikeSnapshot({
    ...current,
    ...values,
    completedStepIds
  });

  const nextStep = getNextOnboardingStep(values.stepId);
  const completed = nextStep === null;
  const completedAt = completed ? new Date().toISOString() : current.completedAt;

  const persisted = await upsertOnboardingPreference(userId, {
    focusArea: nextSnapshot.focusArea ?? null,
    motivationStyle: nextSnapshot.motivationStyle ?? null,
    dailyCommitmentMinutes: nextSnapshot.dailyCommitmentMinutes ?? null,
    primaryObstacle: nextSnapshot.primaryObstacle ?? null,
    ninetyDayVision: nextSnapshot.ninetyDayVision ?? null,
    completedStepIds,
    onboardingCompletedAt: completedAt ? new Date(completedAt) : null
  });

  const answers = mapPreferenceRecord(persisted);

  return {
    answers,
    completed,
    nextStep: completed ? null : getFirstIncompleteStep(answers.completedStepIds)
  };
}

export function isOnboardingComplete(snapshot: OnboardingSnapshot): boolean {
  return Boolean(snapshot.completedAt);
}
