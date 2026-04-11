import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: 0.1,
    sendDefaultPii: false
  });
}
