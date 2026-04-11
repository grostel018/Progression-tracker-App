export const ONBOARDING_STEP_IDS = ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export const MOTIVATION_STYLES = ["intrinsic", "extrinsic", "mixed"] as const;
export type MotivationStyle = (typeof MOTIVATION_STYLES)[number];

export const FOCUS_AREAS = ["health", "learning", "career", "creativity", "relationships", "finance"] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const DAILY_COMMITMENT_OPTIONS = [5, 15, 30, 60] as const;
export type DailyCommitmentMinutes = (typeof DAILY_COMMITMENT_OPTIONS)[number];

export const PRIMARY_OBSTACLES = ["consistency", "motivation", "tracking", "overwhelm"] as const;
export type PrimaryObstacle = (typeof PRIMARY_OBSTACLES)[number];

export type SharedOnboardingAnswers = {
  motivationStyle?: MotivationStyle;
  focusArea?: FocusArea;
  dailyCommitmentMinutes?: DailyCommitmentMinutes;
  primaryObstacle?: PrimaryObstacle;
  ninetyDayVision?: string;
  completedStepIds: OnboardingStepId[];
  completedAt?: string;
};

export type LocalOnboardingAnswers = SharedOnboardingAnswers & {
  id: "default";
  version: 1;
  updatedAt: string;
};

export function isOnboardingStepId(value: string): value is OnboardingStepId {
  return (ONBOARDING_STEP_IDS as readonly string[]).includes(value);
}
