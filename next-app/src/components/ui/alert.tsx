import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "error";

type AlertProps = {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
};

const variantMap: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: {
    icon: Info,
    className: "border-primary/24 bg-primary/12 text-foreground shadow-sm"
  },
  success: {
    icon: CheckCircle2,
    className: "border-primary/28 bg-primary/14 text-foreground shadow-sm"
  },
  error: {
    icon: CircleAlert,
    className: "border-danger/28 bg-danger/12 text-foreground shadow-sm"
  }
};

export function Alert({ title, children, variant = "info", className }: AlertProps): JSX.Element {
  const config = variantMap[variant];
  const Icon = config.icon;
  const liveRegionRole = variant === "error" ? "alert" : "status";

  return (
    <div
      aria-atomic="true"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn("flex items-start gap-3 rounded-[1.35rem] border px-4 py-3.5 text-sm leading-6 shadow-[inset_0_1px_0_var(--color-surface-highlight)]", config.className, className)}
      role={liveRegionRole}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-sm text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
