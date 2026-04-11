export type AuthBootstrapNote = {
  provider: "credentials" | "google";
  enabled: boolean;
};

export type AuthBootstrapUser = {
  email: string;
  username?: string | null;
};

export type AuthActionStatus = "idle" | "success" | "error" | "info";

export type AuthActionState = {
  status: AuthActionStatus;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const AUTH_ACTION_INITIAL_STATE: AuthActionState = {
  status: "idle"
};
