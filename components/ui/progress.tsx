import { cn } from "@/lib/utils";

export function Progress({
  value,
  max,
  className,
  tone = "accent",
  size = "md",
}: {
  value: number;
  max: number;
  className?: string;
  tone?: "accent" | "success" | "danger" | "ember" | "warning";
  size?: "sm" | "md" | "lg";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color =
    tone === "success"
      ? "bg-gradient-to-r from-success/70 to-success"
      : tone === "danger"
        ? "bg-gradient-to-r from-danger/70 to-danger"
        : tone === "ember"
          ? "bg-ember-gradient"
          : tone === "warning"
            ? "bg-gradient-to-r from-warning/70 to-warning"
            : "bg-accent-gradient";
  const h =
    size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-1.5";
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-2/80 ring-1 ring-inset ring-white/[0.03]",
        h,
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({
  value,
  max,
  size = 96,
  stroke = 8,
  tone = "accent",
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  tone?: "accent" | "success" | "danger" | "ember" | "warning";
  label?: string;
  sublabel?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const colorMap = {
    accent: "#5FF6F0",
    success: "#5FF6A8",
    danger: "#F66F6F",
    ember: "#FF8A5C",
    warning: "#F6C95F",
  } as const;
  const stroke_color = colorMap[tone];
  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke_color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          fill="none"
          style={{
            transition: "stroke-dasharray 600ms cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 6px ${stroke_color}66)`,
          }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {label ? (
          <span className="font-mono-num text-lg text-text-primary">{label}</span>
        ) : null}
        {sublabel ? (
          <span className="text-[9px] uppercase tracking-[0.14em] text-text-muted">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
