import { cn } from "@/lib/utils";

export function Progress({
  value,
  max,
  className,
  tone = "accent",
}: {
  value: number;
  max: number;
  className?: string;
  tone?: "accent" | "success" | "danger";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color =
    tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-accent";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
