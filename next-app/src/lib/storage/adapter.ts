import type { StorageMode, StorageRecord } from "./types";

export interface StorageAdapter {
  readonly mode: StorageMode;
  isAvailable(): Promise<boolean>;
  read<TValue>(key: string): Promise<StorageRecord<TValue> | null>;
  write<TValue>(record: StorageRecord<TValue>): Promise<void>;
  remove(key: string): Promise<void>;
  listKeys(prefix?: string): Promise<string[]>;
}
