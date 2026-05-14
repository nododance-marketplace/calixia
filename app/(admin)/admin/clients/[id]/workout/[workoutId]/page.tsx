import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TrainerWorkoutViewPage({
  params,
}: {
  params: { id: string; workoutId: string };
}) {
  const supabase = createClient();
  const { data: workout } = await supabase
    .from("scheduled_workouts")
    .select("*, profiles:client_id(full_name,email)")
    .eq("id", params.workoutId)
    .eq("client_id", params.id)
    .maybeSingle();

  if (!workout) notFound();

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
        .order("set_number")
    : { data: [] as any[] };

  const logsByExercise: Record<string, any[]> = {};
  for (const l of logs ?? []) {
    logsByExercise[l.scheduled_exercise_id] = logsByExercise[l.scheduled_exercise_id] ?? [];
    logsByExercise[l.scheduled_exercise_id].push(l);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/clients/${params.id}`}
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            {workout.scheduled_date}
          </p>
          <h1 className="text-xl text-text-primary">{workout.name}</h1>
        </div>
        <Badge
          variant={
            workout.status === "completed"
              ? "success"
              : workout.status === "skipped"
                ? "danger"
                : "muted"
          }
        >
          {workout.status}
        </Badge>
      </div>

      {workout.client_comment || workout.difficulty_rating ? (
        <Card>
          <CardHeader>
            <CardTitle>Client feedback</CardTitle>
            {workout.difficulty_rating ? (
              <span className="text-xs text-text-secondary">
                Rated {workout.difficulty_rating}/5
              </span>
            ) : null}
          </CardHeader>
          {workout.client_comment ? (
            <p className="text-sm text-text-primary">"{workout.client_comment}"</p>
          ) : (
            <p className="text-sm text-text-secondary">No comment.</p>
          )}
        </Card>
      ) : null}

      <div className="space-y-3">
        {exercises?.map((ex) => (
          <Card key={ex.id}>
            <p className="text-text-primary">{ex.name}</p>
            <p className="mt-1 text-xs text-text-secondary">
              Prescribed: {ex.prescribed_sets ?? "—"} × {ex.prescribed_reps ?? "—"} @{" "}
              {ex.prescribed_load ?? "—"}
            </p>
            <div className="mt-3 space-y-1">
              {(logsByExercise[ex.id] ?? []).length === 0 ? (
                <p className="text-xs text-text-secondary">Not logged.</p>
              ) : (
                logsByExercise[ex.id].map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background/40 px-3 py-1.5 text-xs"
                  >
                    <span className="text-text-secondary">Set #{l.set_number}</span>
                    <span className="text-text-primary">{l.completed_reps ?? "—"} reps</span>
                    <span className="text-text-primary">{l.completed_load ?? "—"}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
