import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <textarea
      ref={ref}
      className={cn(
        "surface-field focus-ring min-h-32 w-full rounded-[1.35rem] border px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted/80",
        isInvalid && "border-danger/45 bg-danger/6 hover:border-danger/55 focus-visible:ring-[rgba(255,107,107,0.18)]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
