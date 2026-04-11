"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, HardDrive } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { localOnboardingService } from "@/features/local-mode/onboarding-storage";
import { getFirstIncompleteStep, getNextOnboardingStep, onboardingStepFormSchema } from "@/features/onboarding/schema";
import type { LocalOnboardingAnswers, OnboardingStepId } from "@/types/onboarding";

import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingStepFields } from "./onboarding-step-fields";

const STEP_ORDER: OnboardingStepId[] = ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"];

function getPreviousStepId(currentStep: OnboardingStepId): OnboardingStepId | null {
  const index = STEP_ORDER.indexOf(currentStep);
  return index > 0 ? STEP_ORDER[index - 1] : null;
}

export function LocalOnboardingFlow(): JSX.Element {
  const router = useRouter();
  const [answers, setAnswers] = useState<LocalOnboardingAnswers | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>("motivation-style");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ variant: "success" | "error" | "info"; message: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const nextAnswers = await localOnboardingService.getAnswers();

        if (cancelled) {
          return;
        }

        setAnswers(nextAnswers);
        setCurrentStep(getFirstIncompleteStep(nextAnswers.completedStepIds));
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parsed = onboardingStepFormSchema.safeParse({
      stepId: currentStep,
      motivationStyle: formData.get("motivationStyle"),
      focusArea: formData.get("focusArea"),
      dailyCommitmentMinutes: formData.get("dailyCommitmentMinutes"),
      primaryObstacle: formData.get("primaryObstacle"),
      ninetyDayVision: formData.get("ninetyDayVision")
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(flattened)
            .map(([key, value]) => [key, value?.[0]])
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
        )
      );
      setFeedback({
        variant: "error",
        message: "Choose a valid answer for this step before continuing."
      });
      return;
    }

    setFieldErrors({});
    setFeedback(null);

    const nextAnswers = await localOnboardingService.saveStep(parsed.data.stepId, parsed.data);
    const nextStep = getNextOnboardingStep(parsed.data.stepId);

    setAnswers(nextAnswers);

    if (!nextStep) {
      const completedAnswers = await localOnboardingService.markCompleted();
      setAnswers(completedAnswers);
      setFeedback({
        variant: "success",
        message: "Setup complete. Taking you back to the dashboard..."
      });
      router.push(ROUTES.dashboard);
      return;
    }

    setCurrentStep(nextStep);
    setFeedback({
      variant: "success",
      message: "Saved on this device. You can leave and come back anytime."
    });
  }

  if (status === "loading") {
    return (
      <Card className="bg-background-elevated/80">
        <CardHeader>
          <Badge variant="muted">Loading local setup</Badge>
          <CardTitle className="text-2xl">Restoring your device-first setup.</CardTitle>
          <CardDescription>The app is reading your saved onboarding answers from this browser.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error" || !answers) {
    return (
      <Alert title="Could not load local onboarding" variant="error">
        The app could not read the device-side onboarding state. Refresh and try again.
      </Alert>
    );
  }

  const previousStep = getPreviousStepId(currentStep);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_340px]">
      <Card className="bg-background-elevated/80">
        <CardHeader className="space-y-5">
          <div className="space-y-2">
            <Badge variant="primary">Local mode</Badge>
            <CardTitle className="text-3xl">Shape the workspace on this device first.</CardTitle>
            <CardDescription>Each step saves immediately in local storage, so a refresh or return visit brings you back to the same place.</CardDescription>
          </div>
          <OnboardingProgress completedStepIds={answers.completedStepIds} currentStep={currentStep} />
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-5" key={currentStep} onSubmit={(event) => void handleSubmit(event)}>
            <OnboardingStepFields answers={answers} fieldErrors={fieldErrors} stepId={currentStep} />

            {feedback ? <Alert variant={feedback.variant}>{feedback.message}</Alert> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button disabled={!previousStep} onClick={() => previousStep && setCurrentStep(previousStep)} type="button" variant="secondary">
                Back
              </Button>
              <Button type="submit">{getNextOnboardingStep(currentStep) ? "Save and continue" : "Finish setup"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/16 bg-primary/8">
        <CardHeader>
          <div className="inline-flex size-11 items-center justify-center rounded-[1.25rem] bg-primary/12 text-primary">
            <HardDrive className="size-5" />
          </div>
          <Badge variant="success">Saved locally</Badge>
          <CardTitle className="text-2xl">Your answers stay on this browser.</CardTitle>
          <CardDescription>That makes the flow resumable now and easier to migrate later without inventing a second onboarding shape.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted">
          <div className="rounded-[1.45rem] border border-white/10 bg-background/40 p-4">
            <p className="eyebrow">Current snapshot</p>
            <div className="mt-3 space-y-2">
              <p>Focus area: <span className="text-foreground">{answers.focusArea ?? "Not answered yet"}</span></p>
              <p>Motivation style: <span className="text-foreground">{answers.motivationStyle ?? "Not answered yet"}</span></p>
              <p>Daily rhythm: <span className="text-foreground">{answers.dailyCommitmentMinutes ? `${answers.dailyCommitmentMinutes} minutes` : "Not answered yet"}</span></p>
              <p>Primary obstacle: <span className="text-foreground">{answers.primaryObstacle ?? "Not answered yet"}</span></p>
            </div>
          </div>
          <Alert title="Why this matters" variant="info">
            The dashboard can now resume from a real local onboarding record instead of a temporary placeholder state.
          </Alert>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Partial progress is saved after every answered step.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
