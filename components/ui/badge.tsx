import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "success"
  | "danger"
  | "muted"
  | "accent"
  | "ember"
  | "warning";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-surface-2/80 text-text-primary border border-border",
    success: "bg-success/12 text-success border border-success/25",
    danger: "bg-danger/12 text-danger border border-danger/25",
    muted: "bg-surface/60 text-text-secondary border border-border/60",
    accent: "bg-accent/12 text-accent border border-accent/25",
    ember: "bg-ember/12 text-ember border border-ember/25",
    warning: "bg-warning/12 text-warning border border-warning/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
