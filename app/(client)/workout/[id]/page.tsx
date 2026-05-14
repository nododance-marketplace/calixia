import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutLogger } from "./workout-logger";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workout } = await supabase
    .from("scheduled_workouts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!workout || workout.client_id !== user.id) {
    notFound();
  }

  const { data: exercises } = await supabase
    .from("scheduled_exercises")
    .select("*")
    .eq("scheduled_workout_id", workout.id)
    .order("position");

  const exerciseIds = (exercises ?? []).map((e) => e.id);
  const { data: logs } = exerciseIds.length
    ? await supabase
        .from("exercise_logs")
        .select("*")
        .in("scheduled_exercise_id", exerciseIds)
    : { data: [] as never[] };

  return (
    <WorkoutLogger
      workout={workout}
      exercises={exercises ?? []}
      initialLogs={logs ?? []}
    />
  );
}
