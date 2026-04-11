import type { StorageAdapter } from "@/lib/storage/adapter";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";
import type { LocalOnboardingAnswers, OnboardingStepId } from "@/types/onboarding";

import { localOnboardingAnswersSchema } from "@/features/onboarding/schema";

import { LOCAL_RECORD_NAMESPACES, buildLocalRecordKey } from "./storage";

const LOCAL_ONBOARDING_ANSWERS_KEY = buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.onboarding, "answers");

function createDefaultLocalOnboardingAnswers(now = new Date().toISOString()): LocalOnboardingAnswers {
  return {
    id: "default",
    version: 1,
    completedStepIds: [],
    updatedAt: now
  };
}

function sanitizeLocalOnboardingAnswers(value: unknown): LocalOnboardingAnswers {
  const parsed = localOnboardingAnswersSchema.safeParse(value);

  if (!parsed.success) {
    return createDefaultLocalOnboardingAnswers();
  }

  return parsed.data;
}

export function createLocalOnboardingService(adapter: StorageAdapter = new IndexedDbStorageAdapter()) {
  async function isAvailable(): Promise<boolean> {
    return adapter.isAvailable();
  }

  async function getAnswers(): Promise<LocalOnboardingAnswers> {
    const available = await adapter.isAvailable();

    if (!available) {
      return createDefaultLocalOnboardingAnswers();
    }

    const record = await adapter.read<LocalOnboardingAnswers>(LOCAL_ONBOARDING_ANSWERS_KEY);
    return sanitizeLocalOnboardingAnswers(record?.value);
  }

  async function saveAnswers(input: Partial<LocalOnboardingAnswers>): Promise<LocalOnboardingAnswers> {
    const available = await adapter.isAvailable();
    const now = new Date().toISOString();
    const current = await getAnswers();

    const nextAnswers = sanitizeLocalOnboardingAnswers({
      ...current,
      ...input,
      id: "default",
      version: 1,
      updatedAt: now,
      completedStepIds: Array.from(new Set(input.completedStepIds ?? current.completedStepIds))
    });

    if (!available) {
      return nextAnswers;
    }

    await adapter.write({
      key: LOCAL_ONBOARDING_ANSWERS_KEY,
      value: nextAnswers,
      updatedAt: nextAnswers.updatedAt
    });

    return nextAnswers;
  }

  async function saveStep(stepId: OnboardingStepId, input: Partial<LocalOnboardingAnswers>): Promise<LocalOnboardingAnswers> {
    const current = await getAnswers();

    return saveAnswers({
      ...current,
      ...input,
      completedStepIds: Array.from(new Set([...current.completedStepIds, stepId]))
    });
  }

  async function markCompleted(): Promise<LocalOnboardingAnswers> {
    return saveAnswers({
      completedAt: new Date().toISOString()
    });
  }

  async function reset(): Promise<void> {
    const available = await adapter.isAvailable();

    if (!available) {
      return;
    }

    await adapter.remove(LOCAL_ONBOARDING_ANSWERS_KEY);
  }

  return {
    isAvailable,
    getAnswers,
    saveAnswers,
    saveStep,
    markCompleted,
    reset
  };
}

export const localOnboardingService = createLocalOnboardingService();
