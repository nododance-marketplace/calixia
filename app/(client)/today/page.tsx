import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Dumbbell, Apple, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  addDays,
  firstName,
  formatDateIso,
  greeting,
  startOfWeekMonday,
  timeAgo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const today = new Date();
  const todayIso = formatDateIso(today);
  const weekStart = startOfWeekMonday(today);
  const weekStartIso = formatDateIso(weekStart);
  const weekEndIso = formatDateIso(addDays(weekStart, 6));

  const [{ data: todaysWorkout }, { data: weekWorkouts }, { data: meals }, { data: lastMessage }] =
    await Promise.all([
      supabase
        .from("scheduled_workouts")
        .select("*, scheduled_exercises(id)")
        .eq("client_id", user.id)
        .eq("scheduled_date", todayIso)
        .maybeSingle(),
      supabase
        .from("scheduled_workouts")
        .select("scheduled_date,status")
        .eq("client_id", user.id)
        .gte("scheduled_date", weekStartIso)
        .lte("scheduled_date", weekEndIso),
      supabase
        .from("meals")
        .select("calories,protein_g,carbs_g,fat_g")
        .eq("client_id", user.id)
        .eq("meal_date", todayIso),
      supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const totals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein_g ?? 0),
    }),
    { calories: 0, protein: 0 },
  );

  const completedCount = (weekWorkouts ?? []).filter((w) => w.status === "completed").length;
  const totalScheduled = (weekWorkouts ?? []).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          {format(today, "EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 text-2xl text-text-primary">
          {greeting()}, {firstName(profile?.full_name ?? profile?.email)}.
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's session</CardTitle>
          {todaysWorkout ? (
            <Badge
              variant={
                todaysWorkout.status === "completed"
                  ? "success"
                  : todaysWorkout.status === "skipped"
                    ? "danger"
                    : "muted"
              }
            >
              {todaysWorkout.status}
            </Badge>
          ) : null}
        </CardHeader>
        {todaysWorkout ? (
          <Link
            href={`/workout/${todaysWorkout.id}`}
            className="-m-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2"
          >
            <div className="rounded-2xl bg-surface-2 p-3">
              <Dumbbell className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-text-primary">{todaysWorkout.name}</p>
              <p className="text-xs text-text-secondary">
                {todaysWorkout.scheduled_exercises?.length ?? 0} exercises
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
        ) : (
          <p className="text-sm text-text-secondary">Rest day.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition</CardTitle>
          <Link href="/nutrition" className="text-xs text-accent">
            Log a meal
          </Link>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-secondary">Calories</p>
            <p className="text-text-primary">
              {totals.calories}
              {profile?.daily_calorie_target ? (
                <span className="text-text-secondary"> / {profile.daily_calorie_target}</span>
              ) : null}
            </p>
            {profile?.daily_calorie_target ? (
              <Progress
                value={totals.calories}
                max={profile.daily_calorie_target}
                className="mt-2"
              />
            ) : null}
          </div>
          <div>
            <p className="text-xs text-text-secondary">Protein</p>
            <p className="text-text-primary">
              {totals.protein}g
              {profile?.daily_protein_target_g ? (
                <span className="text-text-secondary"> / {profile.daily_protein_target_g}g</span>
              ) : null}
            </p>
            {profile?.daily_protein_target_g ? (
              <Progress
                value={totals.protein}
                max={profile.daily_protein_target_g}
                className="mt-2"
              />
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <Link href="/messages" className="text-xs text-accent">
            Open
          </Link>
        </CardHeader>
        {lastMessage ? (
          <Link
            href="/messages"
            className="-m-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2"
          >
            <div className="rounded-2xl bg-surface-2 p-3">
              <MessageCircle className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="line-clamp-1 text-sm text-text-primary">{lastMessage.body}</p>
              <p className="text-[11px] text-text-secondary">{timeAgo(lastMessage.created_at)}</p>
            </div>
          </Link>
        ) : (
          <p className="text-sm text-text-secondary">No messages yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <span className="text-xs text-text-secondary">
            {completedCount}/{totalScheduled || 0} completed
          </span>
        </CardHeader>
        <WeekDots weekStart={weekStart} workouts={weekWorkouts ?? []} />
      </Card>
    </div>
  );
}

function WeekDots({
  weekStart,
  workouts,
}: {
  weekStart: Date;
  workouts: { scheduled_date: string; status: string }[];
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = formatDateIso(d);
    const w = workouts.find((x) => x.scheduled_date === iso);
    return { d, w };
  });
  return (
    <div className="flex items-center justify-between">
      {days.map(({ d, w }) => (
        <div key={d.toISOString()} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-text-secondary">
            {format(d, "EEEEE")}
          </span>
          <span
            className={
              w?.status === "completed"
                ? "h-2 w-2 rounded-full bg-success"
                : w?.status === "skipped"
                  ? "h-2 w-2 rounded-full bg-danger"
                  : w
                    ? "h-2 w-2 rounded-full bg-accent"
                    : "h-2 w-2 rounded-full bg-surface-2"
            }
          />
        </div>
      ))}
    </div>
  );
}
