import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { initials, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clients } = await supabase
    .from("profiles")
    .select("id,full_name,email,avatar_url")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clientIds = (clients ?? []).map((c) => c.id);

  const [{ data: lastMessages }, { data: unread }] = clientIds.length
    ? await Promise.all([
        supabase
          .from("messages")
          .select("sender_id,recipient_id,body,created_at")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.in.(${clientIds.join(",")})),and(recipient_id.eq.${user.id},sender_id.in.(${clientIds.join(",")}))`,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("messages")
          .select("sender_id")
          .in("sender_id", clientIds)
          .eq("recipient_id", user.id)
          .is("read_at", null),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const lastByClient: Record<
    string,
    { body: string; created_at: string }
  > = {};
  for (const m of lastMessages ?? []) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!lastByClient[otherId]) {
      lastByClient[otherId] = { body: m.body, created_at: m.created_at };
    }
  }
  const unreadByClient: Record<string, number> = {};
  for (const m of unread ?? []) {
    unreadByClient[m.sender_id] = (unreadByClient[m.sender_id] ?? 0) + 1;
  }

  const ordered = (clients ?? []).slice().sort((a, b) => {
    const ta = lastByClient[a.id]?.created_at ?? "";
    const tb = lastByClient[b.id]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="pt-2 animate-slide-up">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          Trainer
        </p>
        <h1 className="mt-2 font-display text-display-lg text-text-primary">
          Messages
        </h1>
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="No clients yet"
          description="Invite a client to start messaging."
        />
      ) : (
        <div className="space-y-2">
          {ordered.map((c, i) => {
            const last = lastByClient[c.id];
            const unreadCount = unreadByClient[c.id] ?? 0;
            return (
              <Link key={c.id} href={`/admin/messages/${c.id}`}>
                <Card
                  className="animate-slide-up transition-all hover:border-border-strong"
                  style={
                    { animationDelay: `${i * 25}ms` } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-3">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="h-11 w-11 rounded-2xl object-cover ring-1 ring-inset ring-border"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 font-display text-sm text-accent ring-1 ring-inset ring-accent/25">
                        {initials(c.full_name ?? c.email)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-text-primary">
                          {c.full_name ?? c.email}
                        </p>
                        {last ? (
                          <span className="font-mono-num text-[10px] uppercase tracking-[0.14em] text-text-muted">
                            {timeAgo(last.created_at)}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-text-secondary">
                        {last?.body ?? "No messages yet."}
                      </p>
                    </div>
                    {unreadCount > 0 ? (
                      <Badge variant="ember">{unreadCount}</Badge>
                    ) : null}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
