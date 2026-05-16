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
import type {
  ExerciseLog,
  ScheduledExercise,
  ScheduledWorkout,
} from "@/types/database.types";

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

  async function saveLog(
    exerciseId: string,
    setNumber: number,
    patch: Partial<ExerciseLog>,
  ) {
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
      toast({
        title: "Couldn't save set.",
        description: error.message,
        variant: "danger",
      });
      return;
    }
    if (data) {
      setLogs((prev) => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [setNumber]: data as ExerciseLog,
        },
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
        toast({
          title: "Couldn't update workout.",
          description: error.message,
          variant: "danger",
        });
        return;
      }
      setStatus(newStatus);
      toast({
        title:
          newStatus === "completed"
            ? "Workout complete."
            : "Workout marked skipped.",
        variant: newStatus === "completed" ? "success" : "default",
      });
      router.push("/today");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pb-48 animate-fade-in">
      <div className="flex items-center gap-3 pt-1 animate-slide-up">
        <Link
          href="/today"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Workout
          </p>
          <h1 className="font-display text-display-md text-text-primary truncate">
            {workout.name}
          </h1>
        </div>
        <Badge
          variant={
            status === "completed"
              ? "success"
              : status === "skipped"
                ? "danger"
                : "accent"
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
          <p className="text-sm text-text-secondary">
            No exercises in this workout.
          </p>
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

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-[88px] z-30 px-3 md:bottom-3">
        <div className="glass-strong mx-auto flex max-w-2xl flex-col gap-3 rounded-3xl p-4 shadow-elevated">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
              How hard was it?
            </p>
            <button
              type="button"
              onClick={() => setShowComment((v) => !v)}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-text-secondary transition-colors hover:text-text-primary"
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
                  "rounded-full p-1.5 transition-all",
                  rating && n <= rating
                    ? "text-accent drop-shadow-[0_0_8px_rgba(95,246,240,0.5)]"
                    : "text-text-muted hover:text-text-secondary",
                )}
              >
                <Star
                  className="h-7 w-7"
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
              Skip
            </Button>
            <Button
              onClick={() => finish("completed")}
              disabled={pending}
              size="lg"
            >
              Complete
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
  onChange: (
    exerciseId: string,
    setNumber: number,
    patch: Partial<ExerciseLog>,
  ) => Promise<void>;
}) {
  const setCount = useMemo(() => {
    if (exercise.prescribed_sets && exercise.prescribed_sets > 0)
      return exercise.prescribed_sets;
    return 3;
  }, [exercise.prescribed_sets]);

  return (
    <Card className="animate-slide-up">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono-num text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Movement / {String(index).padStart(2, "0")}
          </p>
          <p className="mt-1 font-display text-lg text-text-primary truncate">
            {exercise.name}
          </p>
        </div>
        {exercise.video_url ? (
          <a
            href={exercise.video_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent transition-all hover:border-accent/60 hover:shadow-glow-sm"
            aria-label="Video demo"
          >
            <Video className="h-4 w-4" strokeWidth={1.5} />
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat
          label="Sets × Reps"
          value={`${exercise.prescribed_sets ?? "—"} × ${exercise.prescribed_reps ?? "—"}`}
        />
        <Stat label="Load" value={exercise.prescribed_load ?? "—"} />
        <Stat
          label="Rest"
          value={exercise.rest_seconds ? `${exercise.rest_seconds}s` : "—"}
        />
        <Stat label="Tempo" value={exercise.tempo ?? "—"} />
      </div>

      {exercise.notes ? (
        <p className="mt-3 rounded-2xl border border-border bg-surface-2/40 p-3 text-xs text-text-secondary">
          {exercise.notes}
        </p>
      ) : null}

      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono-num text-sm text-text-primary">{value}</p>
    </div>
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
  onChange: (
    exerciseId: string,
    setNumber: number,
    patch: Partial<ExerciseLog>,
  ) => Promise<void>;
}) {
  const [reps, setReps] = useState<string>(
    value?.completed_reps?.toString() ?? "",
  );
  const [load, setLoad] = useState<string>(value?.completed_load ?? "");
  const completed = !!(value?.completed_reps || value?.completed_load);

  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2 rounded-2xl border px-2 py-1.5 transition-colors",
        completed
          ? "border-accent/25 bg-accent/5"
          : "border-transparent",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full font-mono-num text-xs",
          completed
            ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
            : "bg-surface-2/60 text-text-muted ring-1 ring-inset ring-border",
        )}
      >
        {setNumber}
      </span>
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
        className="h-10 px-3 font-mono-num text-center"
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
        className="h-10 px-3 font-mono-num text-center"
      />
    </div>
  );
}
