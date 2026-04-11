export const APP_NAME = "Progression Tracker";
export const APP_TAGLINE = "Motivation-first progress tracking";

export const ROUTES = {
  marketing: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  firstSteps: "/first-steps",
  planner: "/planner",
  weeklyReview: "/weekly-review",
  settings: "/settings",
  admin: "/admin",
  authAccessMode: "/api/auth/access-mode",
  health: "/api/health",
  reminderDispatch: "/api/internal/reminders/dispatch"
} as const;
