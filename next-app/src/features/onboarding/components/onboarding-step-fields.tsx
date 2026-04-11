"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { ONBOARDING_STEPS } from "@/features/onboarding/schema";
import { cn } from "@/lib/utils";
import type { LocalOnboardingAnswers, OnboardingStepId } from "@/types/onboarding";
import { DAILY_COMMITMENT_OPTIONS, FOCUS_AREAS, MOTIVATION_STYLES, PRIMARY_OBSTACLES } from "@/types/onboarding";

type OnboardingStepFieldsProps = {
  stepId: OnboardingStepId;
  answers: Partial<LocalOnboardingAnswers>;
  fieldErrors?: Record<string, string>;
};

function OptionField({ checked, description, name, onSelect, value, title }: { checked: boolean; description: string; name: string; onSelect: (value: string) => void; value: string; title: string }): JSX.Element {
  return (
    <label className="block cursor-pointer rounded-[1.35rem]">
      <input checked={checked} className="sr-only" name={name} onChange={() => onSelect(value)} type="radio" value={value} />
      <div
        className={cn(
          "rounded-[1.35rem] border p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/35",
          checked
            ? "border-primary bg-primary/12 shadow-[0_0_0_1px_rgba(22,140,103,0.28),0_14px_34px_rgba(22,140,103,0.14)]"
            : "border-border-subtle bg-background/45"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <span
              className={cn(
                "inline-flex w-fit rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-on-primary)] transition-opacity duration-200",
                checked ? "opacity-100" : "opacity-0"
              )}
            >
              Selected
            </span>
          </div>
          <span
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
              checked ? "border-primary bg-primary text-[var(--color-on-primary)]" : "border-border-subtle bg-background-soft text-transparent"
            )}
          >
            <CheckCircle2 className="size-4" />
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
    </label>
  );
}

function getSelectedValue(stepId: OnboardingStepId, answers: Partial<LocalOnboardingAnswers>): string {
  if (stepId === "motivation-style") {
    return answers.motivationStyle ?? "";
  }

  if (stepId === "focus-area") {
    return answers.focusArea ?? "";
  }

  if (stepId === "daily-commitment") {
    return answers.dailyCommitmentMinutes ? String(answers.dailyCommitmentMinutes) : "";
  }

  if (stepId === "primary-obstacle") {
    return answers.primaryObstacle ?? "";
  }

  return "";
}

export function OnboardingStepFields({ stepId, answers, fieldErrors }: OnboardingStepFieldsProps): JSX.Element {
  const step = ONBOARDING_STEPS.find((entry) => entry.id === stepId)!;
  const [selectedValue, setSelectedValue] = useState(() => getSelectedValue(stepId, answers));

  useEffect(() => {
    setSelectedValue(getSelectedValue(stepId, answers));
  }, [answers, stepId]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="eyebrow">{step.eyebrow}</p>
        <h2 className="text-3xl leading-tight sm:text-4xl">{step.title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-muted">{step.description}</p>
      </div>

      {stepId === "motivation-style" ? (
        <div className="grid gap-3 md:grid-cols-3">
          {MOTIVATION_STYLES.map((option) => (
            <OptionField
              checked={selectedValue === option}
              description={
                option === "intrinsic"
                  ? "You move best when the work feels personally meaningful."
                  : option === "extrinsic"
                    ? "Visible progress, rewards, or hard numbers keep the pace up."
                    : "A healthy mix of personal meaning and visible wins keeps you steady."
              }
              key={option}
              name="motivationStyle"
              onSelect={setSelectedValue}
              title={option === "intrinsic" ? "Meaning first" : option === "extrinsic" ? "Results first" : "Balanced"}
              value={option}
            />
          ))}
          {fieldErrors?.motivationStyle ? <p className="text-sm text-danger md:col-span-3">{fieldErrors.motivationStyle}</p> : null}
        </div>
      ) : null}

      {stepId === "focus-area" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {FOCUS_AREAS.map((option) => (
            <OptionField
              checked={selectedValue === option}
              description="This becomes the first lens the workspace uses when it starts feeling personal."
              key={option}
              name="focusArea"
              onSelect={setSelectedValue}
              title={option.charAt(0).toUpperCase() + option.slice(1)}
              value={option}
            />
          ))}
          {fieldErrors?.focusArea ? <p className="text-sm text-danger md:col-span-2 xl:col-span-3">{fieldErrors.focusArea}</p> : null}
        </div>
      ) : null}

      {stepId === "daily-commitment" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {DAILY_COMMITMENT_OPTIONS.map((option) => (
            <OptionField
              checked={selectedValue === String(option)}
              description={option === 5 ? "Tiny starts beat overthinking." : option === 15 ? "A small reliable block most days." : option === 30 ? "A strong focused rhythm you can protect." : "You can make room for serious depth when needed."}
              key={option}
              name="dailyCommitmentMinutes"
              onSelect={setSelectedValue}
              title={`${option} minutes`}
              value={String(option)}
            />
          ))}
          {fieldErrors?.dailyCommitmentMinutes ? <p className="text-sm text-danger md:col-span-2 xl:col-span-4">{fieldErrors.dailyCommitmentMinutes}</p> : null}
        </div>
      ) : null}

      {stepId === "primary-obstacle" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {PRIMARY_OBSTACLES.map((option) => (
            <OptionField
              checked={selectedValue === option}
              description={
                option === "consistency"
                  ? "You usually know what to do, but staying steady is the hard part."
                  : option === "motivation"
                    ? "The emotional drive fades before the result starts to feel real."
                    : option === "tracking"
                      ? "You need a clearer system to tell whether progress is actually happening."
                      : "There are too many moving parts, so getting started feels heavy."
              }
              key={option}
              name="primaryObstacle"
              onSelect={setSelectedValue}
              title={option.charAt(0).toUpperCase() + option.slice(1)}
              value={option}
            />
          ))}
          {fieldErrors?.primaryObstacle ? <p className="text-sm text-danger md:col-span-2">{fieldErrors.primaryObstacle}</p> : null}
        </div>
      ) : null}

      {stepId === "ninety-day-vision" ? (
        <div className="space-y-3">
          <Textarea defaultValue={answers.ninetyDayVision} maxLength={240} name="ninetyDayVision" placeholder="In 90 days, I want to feel more consistent, calmer, and proud that I stayed with the plan..." />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Keep it honest</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Keep it short</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Keep it concrete</span>
          </div>
          {fieldErrors?.ninetyDayVision ? <p className="text-sm text-danger">{fieldErrors.ninetyDayVision}</p> : null}
        </div>
      ) : null}
    </div>
  );
}