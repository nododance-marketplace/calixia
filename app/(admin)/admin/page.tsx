import Link from "next/link";
import { Users, Dumbbell, MessageCircle, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { addDays, formatDateIso, startOfWeekMonday, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = startOfWeekMonday(new Date());
  const weekStartIso = formatDateIso(weekStart);
  const weekEndIso = formatDateIso(addDays(weekStart, 6));

  const [{ count: activeClients }, { count: completedThisWeek }, { count: unread }, recent] =
    await Promise.all([
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
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary">Trainer</p>
        <h1 className="mt-1 text-2xl text-text-primary">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active clients"
          value={activeClients ?? 0}
          href="/admin/clients"
        />
        <StatCard
          icon={<Dumbbell className="h-4 w-4" />}
          label="Workouts this week"
          value={completedThisWeek ?? 0}
        />
        <StatCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="Unread messages"
          value={unread ?? 0}
          href="/admin/messages"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        {!recent.data || recent.data.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Once clients complete workouts, they'll show up here."
          />
        ) : (
          <ul className="space-y-3">
            {recent.data.map((row: any) => (
              <li key={row.id}>
                <Link
                  href={`/admin/clients/${row.client_id}`}
                  className="-m-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2"
                >
                  <div className="rounded-2xl bg-surface-2 p-2.5">
                    <Dumbbell className="h-4 w-4 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">
                      {row.profiles?.full_name ?? row.profiles?.email ?? "Client"} completed{" "}
                      <span className="text-accent">{row.name}</span>
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {row.completed_at ? timeAgo(row.completed_at) : null}
                      {row.difficulty_rating ? ` · ${row.difficulty_rating}/5` : null}
                    </p>
                  </div>
                  {row.difficulty_rating ? (
                    <Badge variant="muted">
                      <Star className="h-3 w-3" fill="currentColor" />
                      {row.difficulty_rating}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <Card className="flex items-center gap-3">
      <div className="rounded-2xl bg-surface-2 p-2.5 text-accent">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="text-2xl text-text-primary">{value}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
