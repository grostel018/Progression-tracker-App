export class WeeklyReviewInputError extends Error {
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "WeeklyReviewInputError";
    this.fieldErrors = fieldErrors;
  }
}

export function isWeeklyReviewInputError(error: unknown): error is WeeklyReviewInputError {
  return error instanceof WeeklyReviewInputError;
}
