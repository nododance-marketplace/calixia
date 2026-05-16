import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_40%,rgba(95,246,240,0.10),transparent_60%)]" />
      <p className="relative font-mono-num text-[10px] uppercase tracking-[0.32em] text-text-muted">
        404
      </p>
      <h1 className="relative mt-3 font-display text-display-lg text-text-primary">
        Page <span className="text-gradient-accent">not found</span>
      </h1>
      <p className="relative mt-3 max-w-xs text-sm text-text-secondary">
        The path you took doesn't exist. Let's get you back on plan.
      </p>
      <Link
        href="/"
        className="group/back relative mt-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-xs uppercase tracking-[0.18em] text-accent transition-all hover:border-accent/60 hover:shadow-glow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover/back:-translate-x-0.5" />
        Back to home
      </Link>
    </main>
  );
}
