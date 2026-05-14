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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-2">
        <Image
          src="/brand/calixia_square.png"
          alt="Calixia"
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-sm font-medium tracking-tight text-text-primary">Calixia</span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </header>
  );
}
