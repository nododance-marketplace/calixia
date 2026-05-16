import Link from "next/link";
import { Users, Dumbbell, MessageCircle, Star, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  addDays,
  formatDateIso,
  startOfWeekMonday,
  timeAgo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = startOfWeekMonday(new Date());
  const weekStartIso = formatDateIso(weekStart);
  const weekEndIso = formatDateIso(addDays(weekStart, 6));

  const [
    { count: activeClients },
    { count: completedThisWeek },
    { count: unread },
    recent,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "client"),
    supabase
      .from("scheduled_workouts")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_date", weekStartIso)
      .lte("scheduled_date", weekEndIso)
      .eq("status", "completed"),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
    supabase
      .from("scheduled_workouts")
      .select(
        "id, name, status, difficulty_rating, completed_at, client_id, profiles:client_id(full_name,email)",
      )
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="pt-2 animate-slide-up">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          Trainer
        </p>
        <h1 className="mt-2 font-display text-display-lg text-text-primary">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active clients"
          value={activeClients ?? 0}
          href="/admin/clients"
          tone="accent"
        />
        <StatCard
          icon={<Dumbbell className="h-4 w-4" />}
          label="Completed this week"
          value={completedThisWeek ?? 0}
          tone="success"
        />
        <StatCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="Unread messages"
          value={unread ?? 0}
          href="/admin/messages"
          tone="ember"
        />
      </div>

      <Card variant="elevated" className="overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_0%,rgba(95,246,240,0.06),transparent_60%)]" />
        <div className="relative">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Latest 20
            </span>
          </CardHeader>
          {!recent.data || recent.data.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Once clients complete workouts, they'll show up here."
            />
          ) : (
            <ul className="space-y-1.5">
              {recent.data.map((row: any) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/clients/${row.client_id}`}
                    className="group/row -m-2 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-2/50"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 ring-1 ring-inset ring-accent/25">
                      <Dumbbell
                        className="h-4 w-4 text-accent"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">
                        <span className="text-text-secondary">
                          {row.profiles?.full_name ??
                            row.profiles?.email ??
                            "Client"}
                        </span>{" "}
                        completed{" "}
                        <span className="text-accent">{row.name}</span>
                      </p>
                      <p className="mt-0.5 font-mono-num text-[10px] uppercase tracking-[0.14em] text-text-muted">
                        {row.completed_at ? timeAgo(row.completed_at) : null}
                        {row.difficulty_rating
                          ? ` · ${row.difficulty_rating}/5`
                          : null}
                      </p>
                    </div>
                    {row.difficulty_rating ? (
                      <Badge variant="muted">
                        <Star className="h-3 w-3" fill="currentColor" />
                        {row.difficulty_rating}
                      </Badge>
                    ) : null}
                    <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  tone?: "accent" | "success" | "ember";
}) {
  const ringStyle = {
    accent: "bg-accent/12 ring-accent/25 text-accent",
    success: "bg-success/12 ring-success/25 text-success",
    ember: "bg-ember/12 ring-ember/25 text-ember",
  }[tone];
  const body = (
    <Card className="group flex items-center gap-4 transition-all hover:border-border-strong">
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${ringStyle}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
          {label}
        </p>
        <p className="mt-0.5 font-mono-num text-3xl text-text-primary">
          {value}
        </p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
