"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { bodyFont, displayFont } from "@/app/fonts";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): JSX.Element {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html className={`${displayFont.variable} ${bodyFont.variable}`} lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground" suppressHydrationWarning>
        <main className="section-shell flex min-h-screen items-center py-16" id="main-content">
          <div className="w-full max-w-2xl rounded-[2rem] border border-danger/25 bg-background-elevated/90 p-8 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-danger">Global error</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Something went wrong while rendering this route.</h1>
            <p className="mt-4 text-sm leading-7 text-muted">The error has been captured for debugging. Try the action again, and if it keeps failing, treat it like a real bug rather than a random glitch.</p>
            <button
              className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-[#082014] shadow-soft transition hover:bg-primary-strong"
              onClick={() => reset()}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

