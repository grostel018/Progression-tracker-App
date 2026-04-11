import type { StorageAdapter } from "@/lib/storage/adapter";
import { IndexedDbStorageAdapter } from "@/lib/storage/local/indexeddb";

export const LOCAL_RECORD_NAMESPACES = {
  system: "system",
  onboarding: "onboarding",
  profile: "profile",
  categories: "categories",
  dreams: "dreams",
  goals: "goals",
  goalLogs: "goal-logs",
  habits: "habits",
  tasks: "tasks",
  habitCompletions: "habit-completions",
  taskCompletions: "task-completions",
  weeklyReviews: "weekly-reviews",
  activity: "activity"
} as const;

export type LocalRecordNamespace = (typeof LOCAL_RECORD_NAMESPACES)[keyof typeof LOCAL_RECORD_NAMESPACES];
export type LocalWorkspaceSurface = "dashboard" | "onboarding" | "weekly-review";

export type LocalWorkspaceState = {
  version: 1;
  initializedAt: string;
  lastAccessedAt: string;
  surfaces: Partial<Record<LocalWorkspaceSurface, string>>;
  entityNamespaces: LocalRecordNamespace[];
};

export type LocalWorkspaceSummary = {
  isAvailable: boolean;
  keyCount: number;
  state: LocalWorkspaceState | null;
};

const LOCAL_WORKSPACE_STATE_KEY = buildLocalRecordKey(LOCAL_RECORD_NAMESPACES.system, "workspace-state");

export function buildLocalRecordKey(namespace: LocalRecordNamespace, id: string): string {
  return `pt:${namespace}:${id}`;
}

export function createLocalWorkspaceService(adapter: StorageAdapter = new IndexedDbStorageAdapter()) {
  async function readState(): Promise<LocalWorkspaceState | null> {
    const record = await adapter.read<LocalWorkspaceState>(LOCAL_WORKSPACE_STATE_KEY);
    return record?.value ?? null;
  }

  async function writeState(state: LocalWorkspaceState): Promise<void> {
    await adapter.write({
      key: LOCAL_WORKSPACE_STATE_KEY,
      value: state,
      updatedAt: state.lastAccessedAt
    });
  }

  async function ensureWorkspaceState(surface?: LocalWorkspaceSurface): Promise<LocalWorkspaceState> {
    const existingState = await readState();
    const now = new Date().toISOString();

    const nextState: LocalWorkspaceState = {
      version: 1,
      initializedAt: existingState?.initializedAt ?? now,
      lastAccessedAt: now,
      surfaces: {
        ...(existingState?.surfaces ?? {}),
        ...(surface ? { [surface]: now } : {})
      },
      entityNamespaces: Object.values(LOCAL_RECORD_NAMESPACES)
    };

    await writeState(nextState);
    return nextState;
  }

  async function getSummary(): Promise<LocalWorkspaceSummary> {
    const available = await adapter.isAvailable();

    if (!available) {
      return {
        isAvailable: false,
        keyCount: 0,
        state: null
      };
    }

    const keys = await adapter.listKeys("pt:");
    const state = await readState();

    return {
      isAvailable: true,
      keyCount: keys.length,
      state
    };
  }

  async function touchSurface(surface: LocalWorkspaceSurface): Promise<LocalWorkspaceSummary> {
    const available = await adapter.isAvailable();

    if (!available) {
      return {
        isAvailable: false,
        keyCount: 0,
        state: null
      };
    }

    await ensureWorkspaceState(surface);
    return getSummary();
  }

  return {
    isAvailable: () => adapter.isAvailable(),
    ensureWorkspaceState,
    getSummary,
    touchSurface
  };
}

export const localWorkspaceService = createLocalWorkspaceService();
