export const AUTH_PROVIDERS = ["credentials", "google"] as const;

export const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email"
} as const;

export const PROTECTED_APP_PREFIXES = ["/dashboard", "/onboarding", "/planner", "/profile", "/settings"] as const;
export const ADMIN_PREFIXES = ["/admin"] as const;
