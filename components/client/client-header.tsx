"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ClientHeader() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
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
            calixia
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-transparent p-2 text-text-muted transition-colors hover:border-border hover:bg-surface hover:text-text-primary"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
