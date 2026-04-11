export class PlanningInputError extends Error {
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "PlanningInputError";
    this.fieldErrors = fieldErrors;
  }
}

export function isPlanningInputError(error: unknown): error is PlanningInputError {
  return error instanceof PlanningInputError;
}
