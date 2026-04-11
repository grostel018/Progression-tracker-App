"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ROUTES } from "@/constants/app";
import { createLocalOnboardingService } from "@/features/local-mode/onboarding-storage";
import { localPlanningService } from "@/features/local-mode/planning-storage";
import { getMinimumSetupStateFromPlanningSnapshot } from "@/features/workspace/state";

export function LocalSetupGate({ children }: { children: ReactNode }): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "redirecting" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const onboardingService = createLocalOnboardingService();
        const [answers, snapshot] = await Promise.all([
          onboardingService.getAnswers(),
          localPlanningService.getSnapshot()
        ]);

        if (cancelled) {
          return;
        }

        if (!answers.completedAt) {
          setStatus("redirecting");
          router.replace(`${ROUTES.onboarding}?mode=local`);
          return;
        }

        const minimumSetup = getMinimumSetupStateFromPlanningSnapshot(snapshot);

        if (!minimumSetup.isComplete) {
          setStatus("redirecting");
          router.replace(ROUTES.firstSteps);
          return;
        }

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading") {
    return <Alert variant="info">Checking your local setup before opening this workspace...</Alert>;
  }

  if (status === "redirecting") {
    return <Alert variant="info">Taking you to the next required setup step...</Alert>;
  }

  if (status === "error") {
    return <Alert variant="error">We could not confirm the local setup state right now.</Alert>;
  }

  return <>{children}</>;
}
