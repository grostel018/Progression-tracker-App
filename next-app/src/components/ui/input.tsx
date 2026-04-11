import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <input
      ref={ref}
      className={cn(
        "surface-field focus-ring flex min-h-12 w-full rounded-[1.35rem] border px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-all duration-200",
        isInvalid
          ? "border-danger/50 bg-danger/8 text-foreground placeholder:text-danger/50 focus-visible:ring-danger/40"
          : "focus-within-primary",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
