"use client";

import { useFormState } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/app";
import { type FirstStepsActionState, saveCloudFirstStepsAction } from "@/features/first-steps/actions";

const FIRST_STEPS_ACTION_INITIAL_STATE: FirstStepsActionState = {
  status: "idle"
};

export function FirstStepsCloudWorkspace(): JSX.Element {
  const router = useRouter();
  const [state, action] = useFormState(saveCloudFirstStepsAction, FIRST_STEPS_ACTION_INITIAL_STATE);
  const [starterKind, setStarterKind] = useState<"habit" | "task">("habit");

  useEffect(() => {
    if (state.status === "success") {
      router.push(ROUTES.dashboard);
      router.refresh();
    }
  }, [router, state.status]);

  const completionLabel = useMemo(() => {
    if (starterKind === "habit") {
      return "Create one first goal and one first habit.";
    }

    return "Create one first goal and one first task.";
  }, [starterKind]);

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="success">First steps</Badge>
            <CardTitle className="text-3xl" level={1}>
              Give the workspace one real goal and one first action before everything opens up.
            </CardTitle>
            <CardDescription>
              This keeps the app from dropping you into an empty shell. The goal gives the workspace direction, and the first habit or task gives it momentum from day one.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="primary">Minimum setup</Badge>
            <CardTitle className="text-2xl" level={2}>
              {completionLabel}
            </CardTitle>
            <CardDescription>
              You only need one clean starter set right now. Everything else can grow naturally from there.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Starter form</Badge>
            <CardTitle className="text-2xl" level={2}>
              Set your first rhythm.
            </CardTitle>
            <CardDescription>Keep this simple and honest. You can refine the planner later without redoing the whole setup.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="first-steps-goal-title">First goal</label>
                <Input aria-invalid={state.fieldErrors?.goalTitle ? true : undefined} id="first-steps-goal-title" name="goalTitle" placeholder="Train three times this week" required />
                {state.fieldErrors?.goalTitle ? <p className="text-sm text-danger">{state.fieldErrors.goalTitle}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="first-steps-goal-description">Why this matters</label>
                <Textarea id="first-steps-goal-description" name="goalDescription" placeholder="A short note that helps future-you remember why this is worth doing." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="first-steps-starter-kind">Starter action type</label>
                <Select id="first-steps-starter-kind" name="starterKind" onChange={(event) => setStarterKind(event.target.value as "habit" | "task")} value={starterKind}>
                  <option value="habit">Start with a habit</option>
                  <option value="task">Start with a task</option>
                </Select>
              </div>

              {starterKind === "habit" ? (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-habit-title">First habit</label>
                    <Input aria-invalid={state.fieldErrors?.habitTitle ? true : undefined} id="first-steps-habit-title" name="habitTitle" placeholder="Workout" required />
                    {state.fieldErrors?.habitTitle ? <p className="text-sm text-danger">{state.fieldErrors.habitTitle}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-habit-description">Habit note</label>
                    <Textarea id="first-steps-habit-description" name="habitDescription" placeholder="A tiny cue that makes it easier to start." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-habit-frequency">Frequency</label>
                    <Select defaultValue="DAILY" id="first-steps-habit-frequency" name="habitFrequency">
                      <option value="DAILY">Daily</option>
                      <option value="WEEKDAYS">Weekdays</option>
                      <option value="WEEKLY">Weekly</option>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-task-title">First task</label>
                    <Input aria-invalid={state.fieldErrors?.taskTitle ? true : undefined} id="first-steps-task-title" name="taskTitle" placeholder="Book the first gym session" required />
                    {state.fieldErrors?.taskTitle ? <p className="text-sm text-danger">{state.fieldErrors.taskTitle}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-task-description">Task note</label>
                    <Textarea id="first-steps-task-description" name="taskDescription" placeholder="Make the first move concrete and easy to finish." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="first-steps-task-date">Target day</label>
                    <Input aria-invalid={state.fieldErrors?.taskScheduledFor ? true : undefined} id="first-steps-task-date" name="taskScheduledFor" type="date" />
                    {state.fieldErrors?.taskScheduledFor ? <p className="text-sm text-danger">{state.fieldErrors.taskScheduledFor}</p> : null}
                  </div>
                </div>
              )}

              {state.message ? <Alert variant={state.status === "error" ? "error" : "success"}>{state.message}</Alert> : null}

              <Button type="submit">
                {state.status === "success" ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Setup complete
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
            <CardTitle className="text-2xl" level={2}>
              The workspace should feel alive the first time you land in it.
            </CardTitle>
            <CardDescription>
              Instead of an empty planner and a dashboard with nothing to say, this starter step gives the app just enough signal to stay motivating and honest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-foreground">One goal anchors the direction.</p>
              <p className="mt-2">The dashboard and planner can now talk about something real instead of generic setup language.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-foreground">One habit or task anchors the next move.</p>
              <p className="mt-2">That is enough for activity, reminders, review prompts, and the first feeling of momentum to start making sense.</p>
            </div>
            <div className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              Intentional setup beats a technically finished empty workspace.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}



