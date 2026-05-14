import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "danger" | "muted" | "accent";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-surface-2 text-text-primary border border-border",
    success: "bg-success/15 text-success border border-success/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    muted: "bg-surface text-text-secondary border border-border",
    accent: "bg-accent/15 text-accent border border-accent/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
