import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface/30 px-6 py-14 text-center backdrop-blur-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-12 h-32 bg-hero-radial" />
      {icon ? (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2/60 text-text-secondary">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-lg text-text-primary">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
