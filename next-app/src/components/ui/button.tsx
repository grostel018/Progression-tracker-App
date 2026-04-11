import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-[var(--color-on-primary)] shadow-[var(--shadow-accent)] hover:bg-primary-strong hover:shadow-[0_18px_34px_rgba(72,191,141,0.2)]",
        secondary: "border border-[color:var(--color-border-soft)] bg-[var(--color-surface-field)] text-foreground hover:border-[color:var(--color-border-strong)] hover:bg-[var(--color-surface-field-hover)]",
        subtle: "bg-primary/12 text-foreground hover:bg-primary/18 hover:text-primary",
        ghost: "text-muted hover:bg-[var(--color-surface-muted-hover)] hover:text-foreground"
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-9 px-3.5 py-2 text-xs",
        lg: "min-h-12 px-6 py-3.5 text-base",
        icon: "size-11 rounded-[1.2rem]"
      },
      fullWidth: {
        true: "w-full",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ asChild = false, className, fullWidth, size, variant, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, fullWidth }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
