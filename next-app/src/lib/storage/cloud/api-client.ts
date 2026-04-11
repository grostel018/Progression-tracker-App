import type { StorageAdapter } from "../adapter";
import type { StorageRecord } from "../types";

export class CloudStorageAdapter implements StorageAdapter {
  public readonly mode = "cloud" as const;

  public async isAvailable(): Promise<boolean> {
    return false;
  }

  public async read<TValue>(_key: string): Promise<StorageRecord<TValue> | null> {
    return null;
  }

  public async write<TValue>(_record: StorageRecord<TValue>): Promise<void> {
    throw new Error("Cloud persistence calls will be implemented in later milestones.");
  }

  public async remove(_key: string): Promise<void> {
    throw new Error("Cloud persistence calls will be implemented in later milestones.");
  }

  public async listKeys(_prefix?: string): Promise<string[]> {
    return [];
  }
}
