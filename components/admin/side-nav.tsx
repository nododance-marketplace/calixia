"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/clients", label: "Clients", Icon: Users },
  { href: "/admin/templates", label: "Templates", Icon: Layers },
  { href: "/admin/messages", label: "Messages", Icon: MessageCircle },
];

export function SideNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border/60 bg-background/80 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-inset ring-accent/25">
          <Image
            src="/brand/calixia_square.png"
            alt="Calixia"
            width={28}
            height={28}
          />
        </div>
        <div>
          <p className="font-display text-base tracking-tight text-text-primary">
            calixia
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Coach
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-2">
        <ul className="space-y-0.5">
          {items.map(({ href, label, Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(95,246,240,0.18)]"
                      : "text-text-secondary hover:bg-surface/70 hover:text-text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="font-medium tracking-tight">{label}</span>
                  {href === "/admin/messages" && unreadCount > 0 ? (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-semibold text-[#0A0E13]">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface/70 hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <div className="sticky bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
      <nav className="glass-strong mx-auto max-w-2xl rounded-2xl shadow-elevated">
        <ul className="flex items-stretch justify-around px-2 py-1.5">
          {items.map(({ href, label, Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors",
                    active
                      ? "text-accent"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                      active &&
                        "bg-accent/12 shadow-[inset_0_0_0_1px_rgba(95,246,240,0.25)]",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </span>
                  <span className="font-medium">{label}</span>
                  {href === "/admin/messages" && unreadCount > 0 ? (
                    <span className="absolute right-[calc(50%-22px)] top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ember px-1 text-[9px] font-semibold text-[#0A0E13]">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
