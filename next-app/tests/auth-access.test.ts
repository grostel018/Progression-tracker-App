import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/app";
import { resolveAccessDecision } from "@/lib/auth/access";
import { USER_ROLES } from "@/lib/auth/roles";

describe("route access decisions", () => {
  it("redirects signed-out users away from protected app routes", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.dashboard,
      hasLocalAccess: false,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({
      allow: false,
      redirectTo: `${ROUTES.signIn}?returnTo=%2Fdashboard`
    });
  });

  it("redirects signed-out users away from weekly review", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.weeklyReview,
      hasLocalAccess: false,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({
      allow: false,
      redirectTo: `${ROUTES.signIn}?returnTo=%2Fweekly-review`
    });
  });

  it("redirects signed-out users away from settings", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.settings,
      hasLocalAccess: false,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({
      allow: false,
      redirectTo: `${ROUTES.signIn}?returnTo=%2Fsettings`
    });
  });

  it("allows local mode into protected app routes", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.onboarding,
      hasLocalAccess: true,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({ allow: true });
  });

  it("allows local mode into weekly review", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.weeklyReview,
      hasLocalAccess: true,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({ allow: true });
  });

  it("allows local mode into settings", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.settings,
      hasLocalAccess: true,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({ allow: true });
  });

  it("blocks signed-out users from admin routes", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.admin,
      hasLocalAccess: false,
      hasCloudSession: false,
      role: null
    });

    expect(decision).toEqual({
      allow: false,
      redirectTo: `${ROUTES.signIn}?returnTo=%2Fadmin`
    });
  });

  it("redirects non-admin cloud users away from admin routes", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.admin,
      hasLocalAccess: false,
      hasCloudSession: true,
      role: USER_ROLES.USER
    });

    expect(decision).toEqual({
      allow: false,
      redirectTo: ROUTES.dashboard
    });
  });

  it("allows admins into admin routes", () => {
    const decision = resolveAccessDecision({
      pathname: ROUTES.admin,
      hasLocalAccess: false,
      hasCloudSession: true,
      role: USER_ROLES.ADMIN
    });

    expect(decision).toEqual({ allow: true });
  });
});
