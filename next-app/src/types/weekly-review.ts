export type WeeklyReviewSummarySnapshot = {
  referenceDate: string;
  weekStart: string;
  weekEnd: string;
  totalCompletions: number;
  habitCompletions: number;
  taskCompletions: number;
  activeDays: number;
  scheduledHabitCount: number;
  missedHabitCount: number;
  completedTaskCount: number;
  openTaskCount: number;
  openScheduledTaskCount: number;
  currentStreakDays: number;
  topGoalTitle?: string | null;
  wins: string[];
  missedAreas: string[];
};

export type WeeklyReviewRecord = {
  id: string;
  weekStart: string;
  weekEnd: string;
  reflection?: string | null;
  summarySnapshot: WeeklyReviewSummarySnapshot;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveWeeklyReviewInput = {
  weekStart: string;
  reflection?: string;
};

export type WeeklyReviewWorkspace = {
  insights: WeeklyReviewSummarySnapshot & {
    days: Array<{
      date: string;
      label: string;
      total: number;
      habitCount: number;
      taskCount: number;
      isToday: boolean;
      isActive: boolean;
    }>;
    recentActivity: Array<{
      id: string;
      kind: "habit" | "task";
      title: string;
      goalTitle?: string | null;
      completedAt: string;
      completionDate: string;
      detail: string;
    }>;
  };
  currentReview: WeeklyReviewRecord | null;
  recentReviews: WeeklyReviewRecord[];
};
