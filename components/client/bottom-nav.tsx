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
    <nav className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] uppercase tracking-wide transition-colors",
                  active
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span>{label}</span>
                {href === "/messages" && unreadCount > 0 ? (
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
