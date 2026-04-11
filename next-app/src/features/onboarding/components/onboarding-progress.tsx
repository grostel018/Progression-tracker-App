import { Badge } from "@/components/ui/badge";
import type { OnboardingStepId } from "@/types/onboarding";

const STEP_META: Array<{ id: OnboardingStepId; short: string; label: string }> = [
  { id: "motivation-style", short: "01", label: "Motivation" },
  { id: "focus-area", short: "02", label: "Focus area" },
  { id: "daily-commitment", short: "03", label: "Daily rhythm" },
  { id: "primary-obstacle", short: "04", label: "Obstacle" },
  { id: "ninety-day-vision", short: "05", label: "90-day vision" }
];

type OnboardingProgressProps = {
  currentStep: OnboardingStepId;
  completedStepIds: OnboardingStepId[];
};

export function OnboardingProgress({ currentStep, completedStepIds }: OnboardingProgressProps): JSX.Element {
  const currentIndex = STEP_META.findIndex((item) => item.id === currentStep);
  const completedCount = completedStepIds.length;
  const safeIndex = Math.max(currentIndex, 0);
  const progress = STEP_META.length > 1 ? Math.round((safeIndex / (STEP_META.length - 1)) * 100) : 100;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="muted">Step {safeIndex + 1} of {STEP_META.length}</Badge>
        <p className="text-sm text-muted">{completedCount === 0 ? "No answers saved yet" : `${completedCount} answered already`}</p>
      </div>

      <div className="h-2 rounded-full bg-white/[0.06]">
        <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
        {STEP_META.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isComplete = completedStepIds.includes(step.id);

          return (
            <div
              className={`min-w-[9.75rem] snap-start rounded-[1.2rem] border px-3 py-3 text-left transition sm:min-w-0 ${
                isCurrent
                  ? "border-primary/30 bg-primary/10"
                  : isComplete
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-white/8 bg-transparent"
              }`}
              key={step.id}
            >
              <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${isCurrent || isComplete ? "text-primary" : "text-muted"}`}>
                {step.short}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{step.label}</p>
              <p className="mt-1 text-xs text-muted">{index < safeIndex ? "Saved" : isCurrent ? "Current" : "Next"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
