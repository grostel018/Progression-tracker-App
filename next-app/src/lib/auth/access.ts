import { ROUTES } from "@/constants/app";

import { USER_ROLES, type UserRole } from "./roles";

export type AccessDecisionInput = {
  pathname: string;
  hasLocalAccess: boolean;
  hasCloudSession: boolean;
  role?: UserRole | null;
};

export type AccessDecision = {
  allow: boolean;
  redirectTo?: string;
};

function signInRedirect(pathname: string): string {
  return `${ROUTES.signIn}?returnTo=${encodeURIComponent(pathname)}`;
}

export function resolveAccessDecision({ pathname, hasLocalAccess, hasCloudSession, role }: AccessDecisionInput): AccessDecision {
  const isAdminRoute = pathname.startsWith(ROUTES.admin);
  const isProtectedAppRoute = pathname.startsWith(ROUTES.dashboard)
    || pathname.startsWith(ROUTES.onboarding)
    || pathname.startsWith(ROUTES.firstSteps)
    || pathname.startsWith(ROUTES.planner)
    || pathname.startsWith(ROUTES.weeklyReview)
    || pathname.startsWith(ROUTES.settings);

  if (isAdminRoute) {
    if (!hasCloudSession) {
      return { allow: false, redirectTo: signInRedirect(pathname) };
    }

    if (role !== USER_ROLES.ADMIN) {
      return { allow: false, redirectTo: ROUTES.dashboard };
    }
  }

  if (isProtectedAppRoute && !hasCloudSession && !hasLocalAccess) {
    return { allow: false, redirectTo: signInRedirect(pathname) };
  }

  return { allow: true };
}
