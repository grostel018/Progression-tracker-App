import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { ProtectedAppNav } from "@/components/shared/protected-app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants/app";
import { leaveLocalMode } from "@/features/auth/actions/public-access";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAccessContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const navItems = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.onboarding, label: "Setup" },
  { href: ROUTES.firstSteps, label: "First steps" },
  { href: ROUTES.planner, label: "Planner" },
  { href: ROUTES.weeklyReview, label: "Weekly review" },
  { href: ROUTES.settings, label: "Settings" }
] as const;

export default async function ProtectedAppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const access = await getAccessContext();
  const isLocalMode = access.hasLocalAccess;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/82 backdrop-blur-2xl">
        <div className="section-shell grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 py-3 xl:grid-cols-[minmax(380px,1fr)_auto_minmax(260px,1fr)]">
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
            <Link className="group inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.16em] text-primary transition-colors duration-200 hover:text-primary-strong" href={ROUTES.dashboard}>
              <span className="size-2.5 rounded-full bg-primary shadow-[0_0_0_5px_rgba(103,224,184,0.12)] transition-shadow duration-200 group-hover:shadow-[0_0_0_6px_rgba(103,224,184,0.18)]" />
              {APP_NAME}
            </Link>
            <Badge variant={isLocalMode ? "success" : "muted"} className="hidden sm:flex">
              {isLocalMode ? "Local workspace" : "Cloud workspace"}
            </Badge>
          </div>

          <ProtectedAppNav items={navItems} />

          <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-2 sm:gap-3 xl:col-start-3">
            <div className="hidden min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-medium text-primary xl:flex">
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">Workspace ready</span>
            </div>
            {isLocalMode ? (
              <form action={leaveLocalMode}>
                <Button type="submit" variant="secondary" className="min-h-9 text-xs">
                  Exit local mode
                </Button>
              </form>
            ) : (
              <SignOutButton />
            )}
          </div>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
