import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDays, formatDateIso, startOfWeekMonday } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const todayIso = formatDateIso(today);
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
    const isToday = todayIso === iso;
    const w = workouts?.find((x) => x.scheduled_date === iso);
    return { d, iso, isToday, w };
  });

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="pt-2 animate-slide-up">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          This week
        </p>
        <h1 className="mt-2 font-display text-display-md text-text-primary">
          {format(weekStart, "MMM d")}{" "}
          <span className="text-text-muted">→</span>{" "}
          {format(addDays(weekStart, 6), "MMM d")}
        </h1>
      </div>

      <div className="space-y-3">
        {days.map(({ d, w, isToday }, i) => (
          <Card
            key={d.toISOString()}
            variant={isToday ? "accent" : "default"}
            className="animate-slide-up"
            style={{ animationDelay: `${i * 35}ms` } as React.CSSProperties}
          >
            <CardHeader className="mb-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono-num text-2xl text-text-primary">
                  {format(d, "d")}
                </span>
                <div>
                  <p className="text-sm text-text-primary">
                    {format(d, "EEEE")}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    {format(d, "MMMM")}
                  </p>
                </div>
              </div>
              {isToday ? (
                <Badge variant="accent">Today</Badge>
              ) : w ? (
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
              ) : null}
            </CardHeader>
            {w ? (
              <Link
                href={`/workout/${w.id}`}
                className="group/day -m-2 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-2/40"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 ring-1 ring-inset ring-accent/25">
                  <Dumbbell
                    className="h-4 w-4 text-accent"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">{w.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    <span className="font-mono-num">
                      {w.scheduled_exercises?.length ?? 0}
                    </span>{" "}
                    movements
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-secondary transition-transform group-hover/day:translate-x-0.5 group-hover/day:text-accent" />
              </Link>
            ) : (
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Rest day
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
