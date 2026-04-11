import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants/app";

type AuthShellProps = {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle: string;
  asideBody: string;
  modeLabel?: string;
};

const notes = [
  "Use credentials as the calm default path.",
  "Reveal passwords and fix typos before submit.",
  "Recover gracefully instead of getting stuck."
] as const;

export function AuthShell({ kicker, title, description, children, asideTitle, asideBody, modeLabel = "Secure access" }: AuthShellProps): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="hero-orb left-[5%] top-20 h-44 w-44 bg-primary/14" />
      <div aria-hidden="true" className="hero-orb bottom-10 right-[5%] h-52 w-52 bg-[rgba(255,159,110,0.14)]" />
      <div aria-hidden="true" className="soft-grid absolute inset-x-0 top-0 h-[18rem] opacity-70" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:flex-row lg:items-stretch lg:px-8 lg:py-12">
        <main className="order-1 flex flex-col justify-center surface-panel self-center rounded-[2rem] p-6 shadow-xl shadow-black/20 sm:p-10 lg:max-w-[480px] lg:shadow-2xl" id="main-content">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="muted">{modeLabel}</Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{asideTitle}</h2>
              <p className="text-sm leading-relaxed text-muted sm:text-base">{asideBody}</p>
            </div>
            {children}
          </div>
        </main>

        <aside className="order-2 flex flex-col justify-center lg:flex-1 lg:py-8">
          <div className="max-w-2xl space-y-8 px-4 sm:px-6 lg:px-0">
            <div className="flex items-center justify-between gap-4">
              <Link className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary" href="/">
                <span className="size-3.5 rounded-full bg-primary shadow-[0_0_28px_rgba(103,224,184,0.8)]" />
                {APP_NAME}
              </Link>
              <Link className="hidden items-center gap-1 text-sm text-muted transition-all duration-300 hover:text-foreground hover:scale-105 sm:inline-flex" href="/">
                Back home
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="eyebrow">{kicker}</p>
                <h1 className="max-w-[13ch] text-4xl leading-[0.96] sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">{title}</h1>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">{description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <div className="hover-glow rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-muted transition-all duration-300" key={note}>
                  {note}
                </div>
              ))}
            </div>

            <div className="hover-glow rounded-[1.65rem] border border-primary/20 bg-primary/10 p-6 shadow-lg shadow-primary/5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 inline-flex size-12 items-center justify-center rounded-[1.25rem] bg-primary/15 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-foreground">{modeLabel} should feel easy to trust.</p>
                  <p className="text-sm leading-relaxed text-muted">The goal of these screens is simple: lower friction, keep recovery paths visible, and make the next action obvious before the user has to think about it.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <CheckCircle2 className="size-5 text-primary" />
              <span>Keyboard-friendly focus states and mobile-safe touch targets stay on by default.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
