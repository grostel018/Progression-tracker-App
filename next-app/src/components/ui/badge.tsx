import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        primary: "border-primary/18 bg-primary/12 text-primary",
        muted: "border-[color:var(--color-border-soft)] bg-[var(--color-surface-muted)] text-muted",
        success: "border-primary/20 bg-primary/14 text-primary",
        warning: "border-warning/20 bg-warning/12 text-warning"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
