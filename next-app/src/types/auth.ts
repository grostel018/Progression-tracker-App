export type AuthProvider = "credentials" | "google";

export type AppSessionUser = {
  id: string;
  email: string;
  username: string;
  role: "USER" | "TESTER" | "ADMIN";
};
