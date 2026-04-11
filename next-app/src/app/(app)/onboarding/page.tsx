import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { getAccessContext } from "@/lib/auth/session";
import { CloudOnboardingFlow } from "@/features/onboarding/components/cloud-onboarding-flow";
import { LocalOnboardingFlow } from "@/features/onboarding/components/local-onboarding-flow";
import { getCloudOnboardingState } from "@/features/onboarding/service";
import { getCloudSetupGate } from "@/features/workspace/cloud-setup";

export const metadata: Metadata = {
  title: "Setup",
  description: "Answer a few high-signal questions so the workspace can guide you better."
};

const nextOutcomes = [
  {
    title: "A sharper dashboard",
    text: "The workspace can start speaking in the right tone once it knows what kind of progress lens to use."
  },
  {
    title: "A real first-use checkpoint",
    text: "When onboarding is done, the app now requires one first goal and one first action before it opens the full workspace."
  },
  {
    title: "A cleaner next milestone",
    text: "Goals, habits, and tasks can now arrive through an intentional first-use step instead of an empty handoff."
  }
] as const;

export default async function OnboardingPage(): Promise<JSX.Element> {
  const access = await getAccessContext();

  if (!access.canAccessProtectedApp) {
    redirect(ROUTES.signIn);
  }

  const isLocalMode = access.hasLocalAccess;
  const cloudAnswers = access.cloudUser ? await getCloudOnboardingState(access.cloudUser.id) : null;

  if (access.cloudUser) {
    const gate = await getCloudSetupGate(access.cloudUser.id);

    if (gate.onboardingComplete && !gate.minimumSetupComplete) {
      redirect(ROUTES.firstSteps);
    }

    if (gate.onboardingComplete && gate.minimumSetupComplete) {
      redirect(ROUTES.dashboard);
    }
  }

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_340px]">
        <div className="space-y-5">
          <Badge variant="primary">Setup</Badge>
          <div className="space-y-3">
            <h1 className="max-w-[12ch] text-4xl leading-tight sm:text-5xl">Shape the workspace before the real tracking starts.</h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              {isLocalMode
                ? "Answer a few calm, high-signal questions and keep the result on this device. You can leave and come back without losing your place."
                : "Answer a few calm, high-signal questions and save the result to your account so the dashboard can start from something real."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href={ROUTES.dashboard}>
                Back to dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {isLocalMode ? (
              <Button asChild size="lg" variant="ghost">
                <Link href={ROUTES.signUp}>Account options</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="success">What this setup does</Badge>
            <CardTitle className="text-2xl" level={2}>
              It defines tone, pace, and first-use guidance.
            </CardTitle>
            <CardDescription>This still starts with bootstrap questions, but it now hands off into a real first-goal-and-action checkpoint instead of an empty workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.45rem] border border-white/10 bg-background/45 p-4 text-sm leading-6 text-muted">
              {isLocalMode
                ? "Answers stay on this device for now and lead directly into a local first-steps setup instead of another fragile placeholder handoff."
                : "Answers attach to the account profile now so the cloud workspace can keep a stable onboarding state across sessions and hand off cleanly into first-use setup."}
            </div>
          </CardContent>
        </Card>
      </section>

      {isLocalMode ? <LocalOnboardingFlow /> : <CloudOnboardingFlow initialAnswers={cloudAnswers ?? { completedStepIds: [] }} />}

      <section className="space-y-4">
        <h2 className="sr-only">What onboarding unlocks next</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {nextOutcomes.map((item) => (
            <Card className="bg-background-elevated/80" key={item.title}>
              <CardHeader>
                <div className="inline-flex size-10 items-center justify-center rounded-[1.2rem] bg-primary/12 text-primary">
                  <Compass className="size-4" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Design direction</Badge>
            <CardTitle className="text-2xl" level={2}>
              Playful, calm, and easy to trust.
            </CardTitle>
            <CardDescription>The flow uses soft depth, larger type, and quiet panels so the setup feels guided instead of noisy.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Sparkles className="size-5 text-primary" />
            <CardTitle className="text-xl" level={2}>
              One clear outcome
            </CardTitle>
            <CardDescription>Finish this flow once, then create the first real goal and action before the broader workspace opens.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
