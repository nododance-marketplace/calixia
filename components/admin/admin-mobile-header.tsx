"use client";

import Image from "next/image";

export function AdminMobileHeader({ title }: { title: string }) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Image
        src="/brand/calixia_square.png"
        alt="Calixia"
        width={26}
        height={26}
        className="rounded-md"
      />
      <span className="text-sm font-medium tracking-tight text-text-primary">{title}</span>
    </header>
  );
}
