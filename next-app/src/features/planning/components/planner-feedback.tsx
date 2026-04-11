import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type PlannerInlineStatusProps = {
  variant: "success" | "error";
  children: ReactNode;
};

const statusStyles: Record<PlannerInlineStatusProps["variant"], string> = {
  success: "border-primary/24 bg-primary/12 text-foreground shadow-sm",
  error: "border-danger/24 bg-danger/12 text-foreground shadow-sm"
};

const statusIcons = {
  success: CheckCircle2,
  error: CircleAlert
};

export function PlannerInlineStatus({ variant, children }: PlannerInlineStatusProps): JSX.Element {
  const Icon = statusIcons[variant];

  return (
    <div
      aria-atomic="true"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-[1.4rem] border px-4 py-3 text-sm leading-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        statusStyles[variant]
      )}
      role="status"
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <span className="font-medium">{children}</span>
    </div>
  );
}

export function PlannerFieldError({ id, message }: { id?: string; message?: string }): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <p className="pl-1 text-xs font-medium text-danger/90" id={id}>
      {message}
    </p>
  );
}

export function PlannerFieldLabel({ children, htmlFor, optional }: { children: ReactNode; htmlFor: string; optional?: boolean }): JSX.Element {
  return (
    <label className="block pl-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted/80" htmlFor={htmlFor}>
      <span>{children}</span>
      {optional ? <span className="ml-1 text-muted/60">optional</span> : null}
    </label>
  );
}

export function getPlannerFieldProps(scope: string, name: string, error?: string): {
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  inputProps: {
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
    id: string;
  };
  errorId: string;
  id: string;
} {
  const id = `${scope}-${name}`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;
  const isInvalid = error ? true : undefined;

  return {
    id,
    errorId,
    "aria-invalid": isInvalid,
    "aria-describedby": describedBy,
    inputProps: {
      id,
      "aria-invalid": isInvalid,
      "aria-describedby": describedBy
    }
  };
}

export function PlannerFieldHint({ children }: { children: ReactNode }): JSX.Element {
  return <p className="pl-1 text-xs leading-5 text-muted/70">{children}</p>;
}

export function PlannerEmptyState({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="rounded-[1.3rem] border border-border-subtle bg-background-elevated/60 px-5 py-4 text-sm leading-relaxed text-muted shadow-sm">
      {children}
    </div>
  );
}

export function PlannerReadOnlyHint({ children }: { children?: ReactNode }): JSX.Element {
  return <p className="pl-1 text-xs leading-5 text-muted/70">{children ?? "Editing and archive controls are coming in the next planner pass."}</p>;
}
