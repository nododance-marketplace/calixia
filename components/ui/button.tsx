"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-gradient text-[#0A0E13] shadow-glow-sm hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
        secondary:
          "border border-accent/40 bg-accent/5 text-accent backdrop-blur-sm hover:border-accent/70 hover:bg-accent/10 hover:shadow-glow-sm",
        ghost:
          "text-text-secondary hover:bg-surface-2/60 hover:text-text-primary",
        danger:
          "border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25",
        outline:
          "border border-border bg-surface/40 text-text-primary backdrop-blur-sm hover:border-border-strong hover:bg-surface-2",
        ember:
          "bg-ember-gradient text-[#0A0E13] hover:brightness-110 hover:shadow-ember-glow active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
