import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

export async function GET(): Promise<NextResponse> {
  const env = getServerEnv();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      database: "ready",
      storage: env.STORAGE_DRIVER === "cloud"
        ? Boolean(env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) ? "ready" : "misconfigured"
        : "local",
      reminders: env.REMINDER_DISPATCH_SECRET ? "ready" : "misconfigured",
      sentry: env.SENTRY_DSN ? "configured" : "not-configured"
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      database: "unavailable",
      error: error instanceof Error ? error.message : "Health check failed."
    }, { status: 500 });
  }
}
