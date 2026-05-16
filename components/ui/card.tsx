import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass" | "flat" | "elevated" | "accent";
}) {
  const styles = {
    default:
      "bg-surface/80 border border-border bg-surface-gradient backdrop-blur-sm",
    glass: "glass",
    flat: "bg-surface-2/50 border border-border/60",
    elevated:
      "bg-surface border border-border shadow-elevated bg-surface-gradient",
    accent:
      "bg-accent/5 border border-accent/25 shadow-glow-sm bg-surface-gradient",
  } as const;
  return (
    <div
      className={cn(
        "relative rounded-3xl p-5 transition-colors",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function CardEyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
