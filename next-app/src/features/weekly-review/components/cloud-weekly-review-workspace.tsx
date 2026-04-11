"use client";

import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlannerFieldError, PlannerFieldHint, PlannerFieldLabel, PlannerInlineStatus, getPlannerFieldProps } from "@/features/planning/components/planner-feedback";
import type { WeeklyReviewWorkspace } from "@/types/weekly-review";

import { saveWeeklyReviewAction } from "../actions/cloud";
import type { WeeklyReviewActionState } from "../types";
import { WeeklyReviewShell } from "./weekly-review-shell";

export function CloudWeeklyReviewWorkspace({ initialWorkspace }: { initialWorkspace: WeeklyReviewWorkspace }): JSX.Element {
  const [state, formAction] = useFormState<WeeklyReviewActionState, FormData>(saveWeeklyReviewAction, {
    ...initialWorkspace,
    status: "idle"
  });
  const reflectionField = getPlannerFieldProps("weekly-review", "reflection", state.fieldErrors?.reflection);
  const weekStartField = getPlannerFieldProps("weekly-review", "weekStart", state.fieldErrors?.weekStart);

  return (
    <WeeklyReviewShell
      modeLabel="Cloud workspace"
      status={state.message ? <PlannerInlineStatus variant={state.status === "error" ? "error" : "success"}>{state.message}</PlannerInlineStatus> : null}
      workspace={{
        insights: state.insights,
        currentReview: state.currentReview,
        recentReviews: state.recentReviews
      }}
      reviewForm={
        <form action={formAction} className="space-y-4" key={state.currentReview?.updatedAt ?? state.insights.weekStart}>
          <input
            aria-describedby={weekStartField["aria-describedby"]}
            aria-invalid={weekStartField["aria-invalid"]}
            id={weekStartField.id}
            name="weekStart"
            type="hidden"
            value={state.insights.weekStart}
          />
          <PlannerFieldError id={weekStartField.errorId} message={state.fieldErrors?.weekStart} />
          <div className="space-y-2">
            <PlannerFieldLabel htmlFor={reflectionField.id} optional>
              Reflection note
            </PlannerFieldLabel>
            <Textarea
              defaultValue={state.currentReview?.reflection ?? ""}
              name="reflection"
              placeholder="What worked, what slipped, and what should change next week?"
              rows={7}
              {...reflectionField.inputProps}
            />
            <PlannerFieldHint>Optional. Leaving this empty still stores the summary snapshot for the week.</PlannerFieldHint>
            <PlannerFieldError id={reflectionField.errorId} message={state.fieldErrors?.reflection} />
          </div>
          <Button type="submit">Save weekly review</Button>
        </form>
      }
    />
  );
}
