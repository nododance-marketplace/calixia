import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addDays,
  formatDateIso,
  startOfWeekMonday,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const weekStart = startOfWeekMonday(today);
  const weekStartIso = formatDateIso(weekStart);
  const weekEndIso = formatDateIso(addDays(weekStart, 6));

  const { data: workouts } = await supabase
    .from("scheduled_workouts")
    .select("id,name,scheduled_date,status, scheduled_exercises(id)")
    .eq("client_id", user.id)
    .gte("scheduled_date", weekStartIso)
    .lte("scheduled_date", weekEndIso)
    .order("scheduled_date");

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = formatDateIso(d);
    const isToday = formatDateIso(today) === iso;
    const w = workouts?.find((x) => x.scheduled_date === iso);
    return { d, iso, isToday, w };
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary">This week</p>
        <h1 className="mt-1 text-2xl text-text-primary">
          {format(weekStart, "MMMM d")} – {format(addDays(weekStart, 6), "MMMM d")}
        </h1>
      </div>

      <div className="space-y-3">
        {days.map(({ d, w, isToday }) => (
          <Card key={d.toISOString()} className={isToday ? "border-accent/40" : ""}>
            <CardHeader>
              <CardTitle>
                {format(d, "EEEE")}
                {isToday ? <span className="ml-2 text-accent normal-case">· Today</span> : null}
              </CardTitle>
              <span className="text-xs text-text-secondary">{format(d, "MMM d")}</span>
            </CardHeader>
            {w ? (
              <Link href={`/workout/${w.id}`} className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary">{w.name}</p>
                  <p className="text-xs text-text-secondary">
                    {w.scheduled_exercises?.length ?? 0} exercises
                  </p>
                </div>
                <Badge
                  variant={
                    w.status === "completed"
                      ? "success"
                      : w.status === "skipped"
                        ? "danger"
                        : "muted"
                  }
                >
                  {w.status}
                </Badge>
              </Link>
            ) : (
              <p className="text-sm text-text-secondary">Rest.</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
