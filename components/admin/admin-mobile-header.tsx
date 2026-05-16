"use client";

import Image from "next/image";

export function AdminMobileHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-inset ring-accent/25">
          <Image
            src="/brand/calixia_square.png"
            alt="Calixia"
            width={22}
            height={22}
            className="opacity-90"
          />
        </div>
        <span className="text-sm font-medium tracking-tight text-text-primary">
          {title}
        </span>
      </div>
    </header>
  );
}
