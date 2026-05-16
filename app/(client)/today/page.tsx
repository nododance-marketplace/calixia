import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Dumbbell, MessageCircle, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ring, Progress } from "@/components/ui/progress";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const [
    { data: todaysWorkout },
    { data: weekWorkouts },
    { data: meals },
    { data: lastMessage },
  ] = await Promise.all([
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
      carbs: acc.carbs + (m.carbs_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0 },
  );

  const completedCount = (weekWorkouts ?? []).filter(
    (w) => w.status === "completed",
  ).length;
  const totalScheduled = (weekWorkouts ?? []).length;

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      {/* Greeting */}
      <div className="pt-2 animate-slide-up">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          {format(today, "EEEE · MMMM d")}
        </p>
        <h1 className="mt-2 font-display text-display-md text-text-primary">
          {greeting()},{" "}
          <span className="text-gradient-accent">
            {firstName(profile?.full_name ?? profile?.email)}
          </span>
          .
        </h1>
      </div>

      {/* Hero session card */}
      <Card
        variant="elevated"
        className="overflow-hidden animate-slide-up"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_0%,rgba(95,246,240,0.10),transparent_60%)]" />
        <div className="relative">
          <CardHeader>
            <CardTitle>Today's session</CardTitle>
            {todaysWorkout ? (
              <Badge
                variant={
                  todaysWorkout.status === "completed"
                    ? "success"
                    : todaysWorkout.status === "skipped"
                      ? "danger"
                      : "accent"
                }
              >
                {todaysWorkout.status}
              </Badge>
            ) : (
              <Badge variant="muted">Rest</Badge>
            )}
          </CardHeader>
          {todaysWorkout ? (
            <Link
              href={`/workout/${todaysWorkout.id}`}
              className="group/card -m-2 flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-surface-2/40"
            >
              <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 ring-1 ring-inset ring-accent/30 shadow-glow-sm">
                <Dumbbell
                  className="h-6 w-6 text-accent"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl text-text-primary truncate">
                  {todaysWorkout.name}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-text-muted">
                  <span className="font-mono-num text-text-secondary">
                    {todaysWorkout.scheduled_exercises?.length ?? 0}
                  </span>{" "}
                  movements
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-secondary transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-accent" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2/60">
                <Flame className="h-5 w-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-text-primary">Recovery day</p>
                <p className="text-xs text-text-secondary">
                  Mobility, sleep, hydration.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Nutrition rings */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Nutrition</CardTitle>
          <Link
            href="/nutrition"
            className="text-[10px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-accent-hover"
          >
            Log a meal →
          </Link>
        </CardHeader>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <NutritionRing
            label="Cal"
            value={totals.calories}
            target={profile?.daily_calorie_target ?? 0}
            tone="accent"
          />
          <NutritionRing
            label="Pro"
            value={totals.protein}
            target={profile?.daily_protein_target_g ?? 0}
            tone="success"
            suffix="g"
          />
          <NutritionRing
            label="Carb"
            value={totals.carbs}
            target={profile?.daily_carbs_target_g ?? 0}
            tone="ember"
            suffix="g"
          />
        </div>
      </Card>

      {/* Messages */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <Link
            href="/messages"
            className="text-[10px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-accent-hover"
          >
            Open →
          </Link>
        </CardHeader>
        {lastMessage ? (
          <Link
            href="/messages"
            className="group/msg -m-2 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-2/40"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2/60 ring-1 ring-inset ring-border">
              <MessageCircle
                className="h-5 w-5 text-accent"
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm text-text-primary">
                {lastMessage.body}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-text-muted">
                {timeAgo(lastMessage.created_at)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-secondary transition-transform group-hover/msg:translate-x-0.5" />
          </Link>
        ) : (
          <p className="text-sm text-text-secondary">No messages yet.</p>
        )}
      </Card>

      {/* Week chart */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <span className="font-mono-num text-xs text-text-secondary">
            {completedCount}
            <span className="text-text-muted">
              /{totalScheduled || 0} completed
            </span>
          </span>
        </CardHeader>
        <WeekDots weekStart={weekStart} workouts={weekWorkouts ?? []} />
        {totalScheduled > 0 ? (
          <Progress
            className="mt-4"
            value={completedCount}
            max={totalScheduled}
            tone="accent"
          />
        ) : null}
      </Card>
    </div>
  );
}

function NutritionRing({
  label,
  value,
  target,
  tone,
  suffix = "",
}: {
  label: string;
  value: number;
  target: number;
  tone: "accent" | "success" | "ember" | "warning" | "danger";
  suffix?: string;
}) {
  if (!target) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Ring value={0} max={1} size={84} stroke={7} tone={tone} label="—" />
        <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {label}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring
        value={value}
        max={target}
        size={84}
        stroke={7}
        tone={tone}
        label={`${value}${suffix}`}
        sublabel={`/ ${target}${suffix}`}
      />
      <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
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
  const todayIso = formatDateIso(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = formatDateIso(d);
    const w = workouts.find((x) => x.scheduled_date === iso);
    return { d, iso, w };
  });
  return (
    <div className="flex items-center justify-between">
      {days.map(({ d, iso, w }) => {
        const isToday = iso === todayIso;
        const status = w?.status;
        return (
          <div
            key={iso}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={`text-[10px] uppercase tracking-[0.16em] ${
                isToday ? "text-accent" : "text-text-muted"
              }`}
            >
              {format(d, "EEEEE")}
            </span>
            <span
              className={[
                "h-2 w-2 rounded-full transition-colors",
                status === "completed"
                  ? "bg-success shadow-[0_0_8px_rgba(95,246,168,0.6)]"
                  : status === "skipped"
                    ? "bg-danger"
                    : w
                      ? "bg-accent shadow-[0_0_8px_rgba(95,246,240,0.5)]"
                      : "bg-surface-2 ring-1 ring-inset ring-border",
                isToday && !status ? "ring-1 ring-accent/60" : "",
              ].join(" ")}
            />
          </div>
        );
      })}
    </div>
  );
}
