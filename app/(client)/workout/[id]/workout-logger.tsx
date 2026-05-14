"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, ChevronDown, ChevronUp, Video } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ExerciseLog, ScheduledExercise, ScheduledWorkout } from "@/types/database.types";

type LogMap = Record<string, Record<number, ExerciseLog>>;

export function WorkoutLogger({
  workout,
  exercises,
  initialLogs,
}: {
  workout: ScheduledWorkout;
  exercises: ScheduledExercise[];
  initialLogs: ExerciseLog[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();

  const [logs, setLogs] = useState<LogMap>(() => {
    const map: LogMap = {};
    for (const ex of exercises) map[ex.id] = {};
    for (const log of initialLogs) {
      map[log.scheduled_exercise_id] = map[log.scheduled_exercise_id] ?? {};
      map[log.scheduled_exercise_id][log.set_number] = log;
    }
    return map;
  });

  const [rating, setRating] = useState<number | null>(workout.difficulty_rating);
  const [comment, setComment] = useState<string>(workout.client_comment ?? "");
  const [showComment, setShowComment] = useState(!!workout.client_comment);
  const [status, setStatus] = useState(workout.status);

  async function saveLog(exerciseId: string, setNumber: number, patch: Partial<ExerciseLog>) {
    const existing = logs[exerciseId]?.[setNumber];
    const next: ExerciseLog = {
      id: existing?.id ?? `tmp-${exerciseId}-${setNumber}`,
      scheduled_exercise_id: exerciseId,
      set_number: setNumber,
      completed_reps: existing?.completed_reps ?? null,
      completed_load: existing?.completed_load ?? null,
      notes: existing?.notes ?? null,
      logged_at: new Date().toISOString(),
      ...patch,
    };

    setLogs((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [setNumber]: next },
    }));

    const payload = {
      scheduled_exercise_id: exerciseId,
      set_number: setNumber,
      completed_reps: next.completed_reps,
      completed_load: next.completed_load,
      notes: next.notes,
    };

    const { data, error } = await supabase
      .from("exercise_logs")
      .upsert(payload, { onConflict: "scheduled_exercise_id,set_number" })
      .select()
      .single();

    if (error) {
      toast({ title: "Couldn't save set.", description: error.message, variant: "danger" });
      return;
    }
    if (data) {
      setLogs((prev) => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], [setNumber]: data as ExerciseLog },
      }));
    }
  }

  async function finish(newStatus: "completed" | "skipped") {
    startTransition(async () => {
      const { error } = await supabase
        .from("scheduled_workouts")
        .update({
          status: newStatus,
          difficulty_rating: rating,
          client_comment: comment || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", workout.id);
      if (error) {
        toast({ title: "Couldn't update workout.", description: error.message, variant: "danger" });
        return;
      }
      setStatus(newStatus);
      toast({
        title: newStatus === "completed" ? "Workout complete." : "Workout marked skipped.",
        variant: newStatus === "completed" ? "success" : "default",
      });
      router.push("/today");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-40">
      <div className="flex items-center gap-3">
        <Link
          href="/today"
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-text-secondary">Workout</p>
          <h1 className="text-xl text-text-primary">{workout.name}</h1>
        </div>
        <Badge
          variant={
            status === "completed" ? "success" : status === "skipped" ? "danger" : "muted"
          }
        >
          {status}
        </Badge>
      </div>

      {workout.description ? (
        <p className="text-sm text-text-secondary">{workout.description}</p>
      ) : null}

      <div className="space-y-4">
        {exercises.length === 0 ? (
          <p className="text-sm text-text-secondary">No exercises in this workout.</p>
        ) : (
          exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              index={idx + 1}
              logs={logs[ex.id] ?? {}}
              onChange={saveLog}
            />
          ))
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-border bg-background/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              How hard was it?
            </p>
            <button
              type="button"
              onClick={() => setShowComment((v) => !v)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
            >
              Add a note
              {showComment ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n}`}
                onClick={() => setRating(rating === n ? null : n)}
                className={cn(
                  "rounded-full p-1.5 transition-colors",
                  rating && n <= rating
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Star
                  className="h-6 w-6"
                  strokeWidth={1.5}
                  fill={rating && n <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
          {showComment ? (
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notes for your coach"
              rows={2}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => finish("skipped")}
              disabled={pending}
            >
              Mark skipped
            </Button>
            <Button onClick={() => finish("completed")} disabled={pending}>
              Mark complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  index,
  logs,
  onChange,
}: {
  exercise: ScheduledExercise;
  index: number;
  logs: Record<number, ExerciseLog>;
  onChange: (exerciseId: string, setNumber: number, patch: Partial<ExerciseLog>) => Promise<void>;
}) {
  const setCount = useMemo(() => {
    if (exercise.prescribed_sets && exercise.prescribed_sets > 0) return exercise.prescribed_sets;
    return 3;
  }, [exercise.prescribed_sets]);

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Exercise {index}</p>
          <p className="text-text-primary">{exercise.name}</p>
        </div>
        {exercise.video_url ? (
          <a
            href={exercise.video_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-accent hover:bg-accent/10"
            aria-label="Video demo"
          >
            <Video className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary md:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase">Sets × Reps</p>
          <p className="text-text-primary">
            {exercise.prescribed_sets ?? "—"} × {exercise.prescribed_reps ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase">Load</p>
          <p className="text-text-primary">{exercise.prescribed_load ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase">Rest</p>
          <p className="text-text-primary">
            {exercise.rest_seconds ? `${exercise.rest_seconds}s` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase">Tempo</p>
          <p className="text-text-primary">{exercise.tempo ?? "—"}</p>
        </div>
      </div>

      {exercise.notes ? (
        <p className="mt-3 rounded-2xl border border-border bg-background/40 p-3 text-xs text-text-secondary">
          {exercise.notes}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 text-[10px] uppercase tracking-wide text-text-secondary">
          <span>Set</span>
          <span>Reps</span>
          <span>Load</span>
        </div>
        {Array.from({ length: setCount }, (_, i) => i + 1).map((n) => (
          <SetRow
            key={n}
            exerciseId={exercise.id}
            setNumber={n}
            value={logs[n]}
            onChange={onChange}
          />
        ))}
      </div>
    </Card>
  );
}

function SetRow({
  exerciseId,
  setNumber,
  value,
  onChange,
}: {
  exerciseId: string;
  setNumber: number;
  value?: ExerciseLog;
  onChange: (exerciseId: string, setNumber: number, patch: Partial<ExerciseLog>) => Promise<void>;
}) {
  const [reps, setReps] = useState<string>(value?.completed_reps?.toString() ?? "");
  const [load, setLoad] = useState<string>(value?.completed_load ?? "");

  return (
    <div className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
      <span className="text-xs text-text-secondary">#{setNumber}</span>
      <Input
        type="number"
        inputMode="numeric"
        value={reps}
        placeholder="—"
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => {
          const num = reps === "" ? null : Number(reps);
          if (num !== (value?.completed_reps ?? null)) {
            void onChange(exerciseId, setNumber, { completed_reps: num });
          }
        }}
        className="h-9 px-3"
      />
      <Input
        type="text"
        value={load}
        placeholder="—"
        onChange={(e) => setLoad(e.target.value)}
        onBlur={() => {
          const v = load === "" ? null : load;
          if (v !== (value?.completed_load ?? null)) {
            void onChange(exerciseId, setNumber, { completed_load: v });
          }
        }}
        className="h-9 px-3"
      />
    </div>
  );
}
