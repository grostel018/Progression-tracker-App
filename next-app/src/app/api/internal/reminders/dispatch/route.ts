import { NextResponse } from "next/server";

import { dispatchDueReminders } from "@/features/reminders/service";
import { getServerEnv } from "@/lib/env";

function readDispatchSecret(request: Request): string | null {
  const headerSecret = request.headers.get("x-reminder-dispatch-secret");

  if (headerSecret) {
    return headerSecret;
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const env = getServerEnv();
    const expectedSecret = env.REMINDER_DISPATCH_SECRET ?? process.env.CRON_SECRET ?? null;

    if (!expectedSecret) {
      return NextResponse.json({ error: "Reminder dispatch is not configured." }, { status: 503 });
    }

    const providedSecret = readDispatchSecret(request);

    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await dispatchDueReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Reminder dispatch failed." }, { status: 500 });
  }
}
