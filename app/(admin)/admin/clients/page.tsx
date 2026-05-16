import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import {
  initials,
  addDays,
  formatDateIso,
  startOfWeekMonday,
  timeAgo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = startOfWeekMonday(new Date());
  const weekStartIso = formatDateIso(weekStart);
  const weekEndIso = formatDateIso(addDays(weekStart, 6));

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clientIds = (clients ?? []).map((c) => c.id);

  const [
    { data: weekStatuses },
    { data: lastActivity },
    { data: unreadFromClients },
  ] = clientIds.length
    ? await Promise.all([
        supabase
          .from("scheduled_workouts")
          .select("client_id,status")
          .in("client_id", clientIds)
          .gte("scheduled_date", weekStartIso)
          .lte("scheduled_date", weekEndIso),
        supabase
          .from("scheduled_workouts")
          .select("client_id, completed_at")
          .in("client_id", clientIds)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false }),
        supabase
          .from("messages")
          .select("sender_id")
          .in("sender_id", clientIds)
          .eq("recipient_id", user.id)
          .is("read_at", null),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];

  const adherence: Record<string, { completed: number; total: number }> = {};
  for (const w of weekStatuses ?? []) {
    adherence[w.client_id] = adherence[w.client_id] ?? {
      completed: 0,
      total: 0,
    };
    adherence[w.client_id].total += 1;
    if (w.status === "completed") adherence[w.client_id].completed += 1;
  }
  const lastByClient: Record<string, string | undefined> = {};
  for (const row of lastActivity ?? []) {
    if (!lastByClient[row.client_id])
      lastByClient[row.client_id] = row.completed_at;
  }
  const unreadByClient: Record<string, number> = {};
  for (const m of unreadFromClients ?? []) {
    unreadByClient[m.sender_id] = (unreadByClient[m.sender_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="flex items-end justify-between pt-2 animate-slide-up">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Trainer
          </p>
          <h1 className="mt-2 font-display text-display-lg text-text-primary">
            Clients
          </h1>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="No clients yet"
          description="Invite your first client to get started."
          action={
            <Link href="/admin/clients/new">
              <Button>
                <Plus className="h-4 w-4" />
                Invite client
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {clients.map((c, i) => {
            const adh = adherence[c.id];
            const last = lastByClient[c.id];
            const unread = unreadByClient[c.id] ?? 0;
            const pct = adh && adh.total > 0 ? adh.completed / adh.total : 0;
            return (
              <Link key={c.id} href={`/admin/clients/${c.id}`}>
                <Card
                  className="group h-full animate-slide-up transition-all hover:border-border-strong hover:shadow-glow-sm"
                  style={
                    { animationDelay: `${i * 30}ms` } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={c.full_name ?? c.email}
                      url={c.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">
                        {c.full_name ?? c.email}
                      </p>
                      <p className="truncate text-[11px] text-text-muted">
                        {c.email}
                      </p>
                    </div>
                    {unread > 0 ? (
                      <Badge variant="ember">{unread}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    {adh && adh.total > 0 ? (
                      <Progress
                        value={adh.completed}
                        max={adh.total}
                        tone={pct >= 0.7 ? "success" : "accent"}
                        size="sm"
                      />
                    ) : null}
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em]">
                      <span className="text-text-muted">
                        This week{" "}
                        <span className="font-mono-num text-text-primary">
                          {adh ? `${adh.completed}/${adh.total}` : "—"}
                        </span>
                      </span>
                      <span className="text-text-muted">
                        {last ? `${timeAgo(last)}` : "No activity"}
                      </span>
                    </div>
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

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-11 w-11 rounded-2xl object-cover ring-1 ring-inset ring-border"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12 font-display text-sm text-accent ring-1 ring-inset ring-accent/25">
      {initials(name)}
    </div>
  );
}
