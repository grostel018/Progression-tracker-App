"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { ZodError } from "zod";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/app";
import { createLocalOnboardingService } from "@/features/local-mode/onboarding-storage";
import { createLocalStarterSetup, getStarterProgress } from "@/features/first-steps/service";
import { firstStepsSchema } from "@/features/first-steps/schema";
import { localPlanningService } from "@/features/local-mode/planning-storage";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export function LocalFirstStepsWorkspace(): JSX.Element {
  const router = useRouter();
  const [starterKind, setStarterKind] = useState<"habit" | "task">("habit");
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
          router.replace(`${ROUTES.onboarding}?mode=local`);
          return;
        }

        const starterProgress = getStarterProgress(snapshot);

        if (!starterProgress.needsGoal && !starterProgress.needsAction) {
          router.replace(ROUTES.dashboard);
          return;
        }

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("We could not load the local setup state right now.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("saving");
    setFieldErrors({});
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    try {
      const values = firstStepsSchema.parse({
        goalTitle: formData.get("goalTitle"),
        goalDescription: formData.get("goalDescription") ?? undefined,
        starterKind: formData.get("starterKind"),
        habitTitle: formData.get("habitTitle") ?? undefined,
        habitDescription: formData.get("habitDescription") ?? undefined,
        habitFrequency: formData.get("habitFrequency") ?? "DAILY",
        taskTitle: formData.get("taskTitle") ?? undefined,
        taskDescription: formData.get("taskDescription") ?? undefined,
        taskScheduledFor: formData.get("taskScheduledFor") ?? undefined
      });

      await createLocalStarterSetup(values);
      setStatus("ready");
      setMessage("Your first goal and starter action are saved on this device.");
      router.push(ROUTES.dashboard);
    } catch (error) {
      if (error instanceof ZodError) {
        setFieldErrors(flattenFieldErrors(error));
        setMessage("Check the highlighted fields and try again.");
      } else {
        setMessage("We could not save your first setup steps on this device right now.");
      }
      setStatus("ready");
    }
  }

  if (status === "loading") {
    return <main className="section-shell py-8" id="main-content"><Alert variant="info">Preparing the local starter flow...</Alert></main>;
  }

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="success">First steps</Badge>
            <CardTitle className="text-3xl" level={1}>
              Give this device one real goal and one first action before the full local workspace opens up.
            </CardTitle>
            <CardDescription>
              Local mode should feel intentional too. This starter step makes the browser workspace useful immediately instead of technically complete but empty.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="primary">Local mode</Badge>
            <CardTitle className="text-2xl" level={2}>
              Start with a goal plus {starterKind === "habit" ? "a habit" : "a task"}.
            </CardTitle>
            <CardDescription>Everything you add here stays on this browser until you choose to migrate later.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Starter form</Badge>
            <CardTitle className="text-2xl" level={2}>Set the local rhythm.</CardTitle>
            <CardDescription>One grounded starter set is enough to make the dashboard, planner, and weekly review feel real.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="local-first-goal-title">First goal</label>
                <Input aria-invalid={fieldErrors.goalTitle ? true : undefined} id="local-first-goal-title" name="goalTitle" placeholder="Train three times this week" required />
                {fieldErrors.goalTitle ? <p className="text-sm text-danger">{fieldErrors.goalTitle}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="local-first-goal-description">Why this matters</label>
                <Textarea id="local-first-goal-description" name="goalDescription" placeholder="A short note that helps this goal feel worth it." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="local-first-kind">Starter action type</label>
                <Select id="local-first-kind" name="starterKind" onChange={(event) => setStarterKind(event.target.value as "habit" | "task")} value={starterKind}>
                  <option value="habit">Start with a habit</option>
                  <option value="task">Start with a task</option>
                </Select>
              </div>
              {starterKind === "habit" ? (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-habit-title">First habit</label>
                    <Input aria-invalid={fieldErrors.habitTitle ? true : undefined} id="local-first-habit-title" name="habitTitle" placeholder="Workout" required />
                    {fieldErrors.habitTitle ? <p className="text-sm text-danger">{fieldErrors.habitTitle}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-habit-description">Habit note</label>
                    <Textarea id="local-first-habit-description" name="habitDescription" placeholder="Keep it small enough to be repeatable." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-habit-frequency">Frequency</label>
                    <Select defaultValue="DAILY" id="local-first-habit-frequency" name="habitFrequency">
                      <option value="DAILY">Daily</option>
                      <option value="WEEKDAYS">Weekdays</option>
                      <option value="WEEKLY">Weekly</option>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-task-title">First task</label>
                    <Input aria-invalid={fieldErrors.taskTitle ? true : undefined} id="local-first-task-title" name="taskTitle" placeholder="Book the first gym session" required />
                    {fieldErrors.taskTitle ? <p className="text-sm text-danger">{fieldErrors.taskTitle}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-task-description">Task note</label>
                    <Textarea id="local-first-task-description" name="taskDescription" placeholder="Make the first action concrete and finishable." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="local-first-task-date">Target day</label>
                    <Input aria-invalid={fieldErrors.taskScheduledFor ? true : undefined} id="local-first-task-date" name="taskScheduledFor" type="date" />
                    {fieldErrors.taskScheduledFor ? <p className="text-sm text-danger">{fieldErrors.taskScheduledFor}</p> : null}
                  </div>
                </div>
              )}

              {message ? <Alert variant={message.includes("could not") || message.includes("Check") ? "error" : "success"}>{message}</Alert> : null}

              <Button disabled={status === "saving"} type="submit">
                {status === "saving" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Saving first steps...
                  </>
                ) : (
                  <>
                    Finish first steps
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Why this exists</Badge>
            <CardTitle className="text-2xl" level={2}>Local mode should still feel motivating.</CardTitle>
            <CardDescription>The same minimum setup rule applies here so the planner and weekly review never open into a hollow shell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-foreground">The first goal gives the workspace a direction.</p>
              <p className="mt-2">Even without an account yet, the browser can now show something specific instead of anonymous setup copy.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-foreground">The first action gives it movement.</p>
              <p className="mt-2">That is enough to make local progress, reflection, and later migration feel coherent.</p>
            </div>
            <div className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              Calm setup should still lead to a real next step.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

