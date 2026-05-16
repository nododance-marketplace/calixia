"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Apple, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", Icon: Home },
  { href: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/nutrition", label: "Nutrition", Icon: Apple },
  { href: "/messages", label: "Messages", Icon: MessageCircle },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <div className="sticky bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <nav className="glass-strong mx-auto max-w-2xl rounded-2xl shadow-elevated">
        <ul className="flex items-stretch justify-around px-2 py-1.5">
          {items.map(({ href, label, Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors",
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
                  {href === "/messages" && unreadCount > 0 ? (
                    <span className="absolute right-[calc(50%-22px)] top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ember px-1 text-[9px] font-semibold text-[#0A0E13] shadow-ember-glow">
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
