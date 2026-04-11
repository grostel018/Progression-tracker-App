import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants/app";

export default function NotFound(): JSX.Element {
  return (
    <main className="section-shell relative flex min-h-screen items-center py-16" id="main-content">
      <div aria-hidden="true" className="soft-grid absolute inset-x-0 top-0 h-80 opacity-70" />

      <section className="surface-panel relative w-full overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="space-y-6">
          <Badge className="w-fit" variant="warning">
            404 | Route not found
          </Badge>

          <div className="space-y-3">
            <p className="eyebrow">Off the map</p>
            <h1 className="max-w-[12ch] text-4xl leading-tight sm:text-5xl">This page is not part of {APP_NAME} yet.</h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              The link may be broken, the route may have moved, or you may have jumped ahead of the current app shell. The safest next step is to return to a branded route instead of the default framework 404.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={ROUTES.marketing}>
                Back home
                <Home className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.dashboard}>
                Open dashboard
                <Compass className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted sm:p-5">
            If you expected this route to exist, it is worth checking the navigation path first. Protected routes will still enforce auth and mode checks after you leave this screen.
          </div>
        </div>
      </section>
    </main>
  );
}
