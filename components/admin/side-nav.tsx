"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Layers, MessageCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <aside className="hidden md:flex sticky top-0 h-screen w-60 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 p-5">
        <Image
          src="/brand/calixia_square.png"
          alt="Calixia"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <p className="text-sm font-medium tracking-tight text-text-primary">Calixia</p>
          <p className="text-[10px] uppercase tracking-wider text-text-secondary">Coach</p>
        </div>
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface text-text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                  {href === "/admin/messages" && unreadCount > 0 ? (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium text-[#0F1419]">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-text-primary"
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
    <nav className="md:hidden sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] uppercase tracking-wide transition-colors",
                  active ? "text-accent" : "text-text-secondary",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span>{label}</span>
                {href === "/admin/messages" && unreadCount > 0 ? (
                  <span className="absolute right-[calc(50%-22px)] top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-[#0F1419]">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
