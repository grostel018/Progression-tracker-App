import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cloud, LaptopMinimal, ShieldCheck, Sparkles, Star, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/constants/app";
import { startLocalMode } from "@/features/auth/actions/public-access";

export const metadata: Metadata = {
  title: "Start",
  description: "Choose local mode or create an account to start building momentum."
};

const promises = [
  "Start privately on one device in seconds.",
  "Move to cloud access when you want continuity.",
  "Keep one clear next step visible all the time."
] as const;

const valueCards = [
  {
    icon: ShieldCheck,
    title: "Quiet guidance",
    text: "The interface leads with one action, then lets the rest of the page breathe."
  },
  {
    icon: LaptopMinimal,
    title: "Mobile first",
    text: "The layout is designed to feel natural on a phone before it stretches out on desktop."
  },
  {
    icon: Cloud,
    title: "Two entry paths",
    text: "Local mode is instant. Cloud mode is ready when you want credentials and sync-friendly access."
  }
] as const;

export default function MarketingPage(): JSX.Element {
  return (
    <main className="relative overflow-hidden bg-background" id="main-content">
      <div aria-hidden="true" className="hero-orb left-[4%] top-20 h-56 w-56 bg-primary/16" />
      <div aria-hidden="true" className="hero-orb right-[7%] top-32 h-52 w-52 bg-[rgba(255,159,110,0.18)]" />
      <div aria-hidden="true" className="soft-grid absolute inset-x-0 top-0 h-[24rem] opacity-80" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/82 backdrop-blur-2xl">
        <div className="section-shell flex min-h-20 items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary" href={ROUTES.marketing}>
            <span className="size-3 rounded-full bg-primary shadow-[0_0_24px_rgba(103,224,184,0.7)]" />
            {APP_NAME}
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a className="transition hover:text-foreground" href="#ways-in">
              Ways in
            </a>
            <a className="transition hover:text-foreground" href="#why-it-works">
              Why it works
            </a>
            <a className="transition hover:text-foreground" href="#start-now">
              Start
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" variant="ghost">
              <Link href={ROUTES.signIn}>Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={ROUTES.signUp}>Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="section-shell relative grid min-h-[calc(100svh-5rem)] items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,460px)] lg:py-16">
        <div className="space-y-7">
          <Badge className="w-fit" variant="primary">
            Playful calm creative
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-[11ch] text-5xl leading-[0.9] sm:text-6xl lg:text-8xl">Build momentum that survives real life.</h1>
            <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Progression Tracker is a motivation-first workspace for people who want a clearer rhythm, calmer screens, and less friction between deciding and doing.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={ROUTES.signUp}>
                Create cloud account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <form action={startLocalMode}>
              <Button size="lg" type="submit" variant="secondary">
                Continue locally
              </Button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {promises.map((item) => (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="muted">Preview</Badge>
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
                <Star className="size-3 text-[var(--color-accent)]" />
                Mobile to desktop
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(8,19,29,0.76)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Tonight&apos;s focus</p>
                  <h2 className="mt-3 text-3xl">Reset the rhythm.</h2>
                </div>
                <div className="inline-flex size-11 items-center justify-center rounded-[1.35rem] bg-primary/14 text-primary">
                  <Sparkles className="size-5" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">A summary-first workspace that keeps the primary action visible, the secondary details quiet, and the layout easy to scan in a few seconds.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="eyebrow">Main action</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">Resume onboarding</p>
                  <p className="mt-2 text-sm leading-6 text-muted">The strongest next step stays above the fold.</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="eyebrow">Backup path</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">Cloud or local</p>
                  <p className="mt-2 text-sm leading-6 text-muted">The entry route is clear before the app asks anything else.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Clear forms</p>
                <p className="mt-2 text-sm leading-6 text-muted">Revealable passwords, resend paths, and calmer recovery flows.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Bootstrap flow</p>
                <p className="mt-2 text-sm leading-6 text-muted">Onboarding saves progressively in local and cloud mode.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Gentle depth</p>
                <p className="mt-2 text-sm leading-6 text-muted">Rounded cards, soft shadows, and just enough motion to guide focus.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-6 py-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:py-14" id="ways-in">
        <div className="space-y-4">
          <p className="eyebrow">Choose your route</p>
          <h2 className="max-w-[12ch] text-4xl leading-tight sm:text-5xl">Start private today. Add the cloud when it helps.</h2>
          <p className="max-w-xl text-base leading-7 text-muted">The product is designed around two honest entry points: a fast local mode and a cloud account path for continuity across sessions and devices.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="lift-on-hover border-primary/16 bg-primary/8">
            <CardHeader>
              <Badge variant="success">Local mode</Badge>
              <CardTitle>Get into the workspace fast</CardTitle>
              <CardDescription>Try the experience on this device first, keep your answers local, and move to cloud access later if you want to.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={startLocalMode}>
                <Button fullWidth type="submit">Start locally</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lift-on-hover bg-background-elevated/80">
            <CardHeader>
              <Badge variant="muted">Cloud access</Badge>
              <CardTitle>Use credentials or Google later</CardTitle>
              <CardDescription>Create an account when you want verification, recovery flows, and the path toward a sync-ready experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild fullWidth variant="secondary">
                <Link href={ROUTES.signUp}>Open account setup</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="section-shell py-10 lg:py-14" id="why-it-works">
        <div className="space-y-4">
          <p className="eyebrow">Why it feels different</p>
          <h2 className="max-w-[13ch] text-4xl leading-tight sm:text-5xl">A calmer interface can still feel creative and alive.</h2>
          <p className="max-w-2xl text-base leading-7 text-muted">The design direction favors strong hierarchy, softer depth, and screens that stay readable even when the product grows richer later.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {valueCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card className="lift-on-hover bg-background-elevated/80" key={item.title}>
                <CardHeader>
                  <div className="inline-flex size-12 items-center justify-center rounded-[1.4rem] bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.text}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="section-shell py-10 pb-20 lg:py-14 lg:pb-24" id="start-now">
        <div className="surface-panel flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Start now</p>
            <h2 className="max-w-[14ch] text-3xl leading-tight sm:text-4xl">Pick the pace that feels right today.</h2>
            <p className="max-w-2xl text-base leading-7 text-muted">If you want the fastest possible start, use local mode. If you already know you want an account path, go straight to cloud setup.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={startLocalMode}>
              <Button size="lg" type="submit" variant="secondary">
                Start local mode
              </Button>
            </form>
            <Button asChild size="lg">
              <Link href={ROUTES.signUp}>
                Create account
                <WandSparkles className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

