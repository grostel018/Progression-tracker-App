"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Cloud, CheckCircle2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import type { OnboardingStepId } from "@/types/onboarding";

import { submitCloudOnboardingStep } from "../actions/cloud";
import { getFirstIncompleteStep, getNextOnboardingStep } from "../schema";
import type { OnboardingSnapshot } from "../service";
import { ONBOARDING_ACTION_INITIAL_STATE } from "../types";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingStepFields } from "./onboarding-step-fields";

const STEP_ORDER: OnboardingStepId[] = ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"];

function getPreviousStepId(currentStep: OnboardingStepId): OnboardingStepId | null {
  const index = STEP_ORDER.indexOf(currentStep);
  return index > 0 ? STEP_ORDER[index - 1] : null;
}

export function CloudOnboardingFlow({ initialAnswers }: { initialAnswers: OnboardingSnapshot }): JSX.Element {
  const router = useRouter();
  const initialStep = useMemo(() => getFirstIncompleteStep(initialAnswers.completedStepIds), [initialAnswers.completedStepIds]);
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>(initialStep);
  const [answers, setAnswers] = useState(initialAnswers);
  const [state, formAction] = useFormState(submitCloudOnboardingStep, {
    ...ONBOARDING_ACTION_INITIAL_STATE,
    answers: initialAnswers,
    currentStep: initialStep
  });

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setAnswers(state.answers);

    if (state.completed) {
      router.push(ROUTES.dashboard);
      return;
    }

    if (state.nextStep) {
      setCurrentStep(state.nextStep);
    }
  }, [router, state]);

  const previousStep = getPreviousStepId(currentStep);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_340px]">
      <Card className="bg-background-elevated/80">
        <CardHeader className="space-y-5">
          <div className="space-y-2">
            <Badge variant="primary">Cloud onboarding</Badge>
            <CardTitle className="text-3xl">Save the setup directly to your account.</CardTitle>
            <CardDescription>Each answered step updates your profile progressively, so the workspace can stay consistent when you return.</CardDescription>
          </div>
          <OnboardingProgress completedStepIds={answers.completedStepIds} currentStep={currentStep} />
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={formAction} className="space-y-5" key={currentStep}>
            <input name="stepId" type="hidden" value={currentStep} />
            <OnboardingStepFields answers={answers} fieldErrors={state.fieldErrors} stepId={currentStep} />

            {state.message ? <Alert variant={state.status === "error" ? "error" : "success"}>{state.message}</Alert> : null}

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
            <Cloud className="size-5" />
          </div>
          <Badge variant="success">Saved to account</Badge>
          <CardTitle className="text-2xl">Your setup follows the account.</CardTitle>
          <CardDescription>The cloud shape intentionally mirrors the local onboarding model so later migration and sync logic stays clean.</CardDescription>
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
          <Alert title="What unlocks next" variant="info">
            Once setup is complete, the dashboard can reflect a real focus profile instead of a generic shell.
          </Alert>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Completion state stays attached to the account when you sign back in.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
