export const STORAGE_MODES = {
  LOCAL: "local",
  CLOUD: "cloud"
} as const;

export type StorageMode = (typeof STORAGE_MODES)[keyof typeof STORAGE_MODES];

export type StorageRecord<TValue = unknown> = {
  key: string;
  value: TValue;
  updatedAt: string;
};
