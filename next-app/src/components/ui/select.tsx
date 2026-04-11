import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "surface-field focus-ring min-h-12 w-full appearance-none rounded-[1.35rem] border px-4 py-3 pr-11 text-sm text-foreground",
          className
        )}
        {...props}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 inline-flex items-center text-muted">
        <ChevronDown className="size-4" />
      </span>
    </div>
  );
});
Select.displayName = "Select";

export { Select };
