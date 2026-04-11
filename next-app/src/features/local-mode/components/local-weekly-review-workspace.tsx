"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlannerFieldError, PlannerFieldHint, PlannerFieldLabel, PlannerInlineStatus, getPlannerFieldProps } from "@/features/planning/components/planner-feedback";
import type { WeeklyReviewWorkspace } from "@/types/weekly-review";

import { isWeeklyReviewInputError } from "@/features/weekly-review/errors";
import { localWeeklyReviewService } from "@/features/local-mode/weekly-review-storage";

import { WeeklyReviewShell } from "@/features/weekly-review/components/weekly-review-shell";

export function LocalWeeklyReviewWorkspace(): JSX.Element {
  const [workspace, setWorkspace] = useState<WeeklyReviewWorkspace | null>(null);
  const [status, setStatus] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [reflection, setReflection] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const reflectionField = getPlannerFieldProps("local-weekly-review", "reflection", fieldErrors.reflection);

  useEffect(() => {
    let active = true;

    localWeeklyReviewService.getWorkspace().then((nextWorkspace) => {
      if (!active) {
        return;
      }

      setWorkspace(nextWorkspace);
      setReflection(nextWorkspace.currentReview?.reflection ?? "");
    }).catch(() => {
      if (!active) {
        return;
      }

      setStatus({ variant: "error", message: "Could not load the local weekly review right now." });
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(): Promise<void> {
    if (!workspace) {
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      const nextWorkspace = await localWeeklyReviewService.saveReview({
        weekStart: workspace.insights.weekStart,
        reflection
      });

      setWorkspace(nextWorkspace);
      setReflection(nextWorkspace.currentReview?.reflection ?? "");
      setStatus({
        variant: "success",
        message: nextWorkspace.currentReview?.reflection ? "Weekly review saved locally." : "Weekly review saved locally without a reflection note."
      });
    } catch (error) {
      if (isWeeklyReviewInputError(error)) {
        setFieldErrors(error.fieldErrors ?? {});
        setStatus({ variant: "error", message: error.message });
      } else {
        setStatus({ variant: "error", message: "Could not save the local weekly review right now." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (!workspace) {
    return (
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm leading-6 text-muted">
        Loading the local weekly review workspace.
      </div>
    );
  }

  return (
    <WeeklyReviewShell
      modeLabel="Local workspace"
      status={status ? <PlannerInlineStatus variant={status.variant}>{status.message}</PlannerInlineStatus> : null}
      workspace={workspace}
      reviewForm={
        <div className="space-y-4">
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor={reflectionField.id} optional>
              Reflection note
            </PlannerFieldLabel>
            <Textarea
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What worked, what slipped, and what should change next week?"
              rows={7}
              value={reflection}
              {...reflectionField.inputProps}
            />
            <PlannerFieldHint>Optional. Leaving this empty still stores the summary snapshot for the week.</PlannerFieldHint>
            <PlannerFieldError id={reflectionField.errorId} message={fieldErrors.reflection} />
          </div>
          <Button disabled={isSaving} onClick={() => void handleSave()} type="button">
            {isSaving ? "Saving..." : "Save weekly review"}
          </Button>
        </div>
      }
    />
  );
}
