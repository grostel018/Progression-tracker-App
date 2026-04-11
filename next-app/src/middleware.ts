import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { ACCESS_MODE_COOKIE, ACCESS_MODES } from "@/lib/auth/cookies";
import { resolveAccessDecision } from "@/lib/auth/access";
import { isUserRole } from "@/lib/auth/roles";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accessMode = request.cookies.get(ACCESS_MODE_COOKIE)?.value;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET
  });
  const tokenRole = typeof token?.role === "string" && isUserRole(token.role) ? token.role : null;

  const decision = resolveAccessDecision({
    pathname: request.nextUrl.pathname,
    hasLocalAccess: accessMode === ACCESS_MODES.LOCAL,
    hasCloudSession: Boolean(token?.sub),
    role: tokenRole
  });

  if (!decision.allow && decision.redirectTo) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/first-steps/:path*",
    "/planner/:path*",
    "/weekly-review/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
