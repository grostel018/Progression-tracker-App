export const ACCESS_MODE_COOKIE = "pt-access-mode";

export const ACCESS_MODES = {
  LOCAL: "local",
  CLOUD: "cloud"
} as const;

export type AccessMode = (typeof ACCESS_MODES)[keyof typeof ACCESS_MODES];
