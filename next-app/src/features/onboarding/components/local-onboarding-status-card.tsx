"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import type { LocalOnboardingAnswers } from "@/types/onboarding";
import { localOnboardingService } from "@/features/local-mode/onboarding-storage";

export function LocalOnboardingStatusCard(): JSX.Element {
  const [answers, setAnswers] = useState<LocalOnboardingAnswers | null>(null);
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

  if (status === "loading") {
    return (
      <Card className="bg-background-elevated/80">
        <CardHeader>
          <Badge variant="muted">Checking setup state</Badge>
          <CardTitle className="text-xl" level={2}>
            Loading the local onboarding summary.
          </CardTitle>
          <CardDescription>The app is reading the saved bootstrap answers from this browser.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error" || !answers) {
    return (
      <Alert title="Could not read local onboarding" variant="error">
        The device-side onboarding state could not be loaded right now. Reopen onboarding to rebuild it.
      </Alert>
    );
  }

  const isComplete = Boolean(answers.completedAt);

  return (
    <Card className="bg-background-elevated/80">
      <CardHeader>
        <Badge variant={isComplete ? "success" : "primary"}>{isComplete ? "Setup complete" : "Setup still active"}</Badge>
        <CardTitle className="text-2xl" level={2}>
          {isComplete ? "The local setup is saved on this device." : "A few onboarding answers still need attention."}
        </CardTitle>
        <CardDescription>
          {isComplete
            ? `Focus area: ${answers.focusArea ?? "not set"}. Daily rhythm: ${answers.dailyCommitmentMinutes ?? "not set"} minutes.`
            : "Resume the setup so the dashboard can stop guessing and start reflecting something real."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          {isComplete ? "This summary will stay available when you come back on the same device." : "Partial progress is already saved and resumable."}
        </div>
        <Button asChild fullWidth variant={isComplete ? "secondary" : "primary"}>
          <Link href={ROUTES.onboarding}>{isComplete ? "Review setup answers" : "Resume onboarding"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
