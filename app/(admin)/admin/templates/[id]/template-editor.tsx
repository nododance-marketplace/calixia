"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { DAYS_FULL, cn } from "@/lib/utils";
import type { TemplateExercise, TemplateWorkout } from "@/types/database.types";

type EditableExercise = TemplateExercise & { _id: string };
type EditableWorkout = TemplateWorkout & { exercises: EditableExercise[] };

const blankExercise = (): Partial<TemplateExercise> => ({
  name: "",
  sets: null,
  reps: "",
  load: "",
  tempo: "",
  rest_seconds: null,
  notes: "",
  video_url: "",
});

export function TemplateEditor({
  templateId,
  templateName,
  templateDescription,
  initialWorkouts,
}: {
  templateId: string;
  templateName: string;
  templateDescription: string;
  initialWorkouts: (TemplateWorkout & { exercises: TemplateExercise[] })[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [name, setName] = useState(templateName);
  const [description, setDescription] = useState(templateDescription);
  const [workouts, setWorkouts] = useState<Record<number, EditableWorkout | null>>(() => {
    const map: Record<number, EditableWorkout | null> = {};
    for (let i = 0; i < 7; i++) map[i] = null;
    for (const w of initialWorkouts) {
      map[w.day_of_week] = {
        ...w,
        exercises: w.exercises.map((e) => ({ ...e, _id: e.id })),
      };
    }
    return map;
  });
  const [tab, setTab] = useState<string>(
    String(initialWorkouts[0]?.day_of_week ?? 0),
  );

  const headerTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (name === templateName && description === templateDescription) return;
    if (headerTimer.current) clearTimeout(headerTimer.current);
    headerTimer.current = setTimeout(async () => {
      await supabase
        .from("week_templates")
        .update({ name, description: description || null })
        .eq("id", templateId);
      router.refresh();
    }, 600);
    return () => {
      if (headerTimer.current) clearTimeout(headerTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description]);

  async function addWorkoutForDay(day: number) {
    const { data, error } = await supabase
      .from("template_workouts")
      .insert({
        template_id: templateId,
        day_of_week: day,
        name: `${DAYS_FULL[day]} session`,
      })
      .select()
      .single();
    if (error || !data) {
      toast({ title: "Couldn't add workout.", description: error?.message, variant: "danger" });
      return;
    }
    setWorkouts((prev) => ({
      ...prev,
      [day]: { ...(data as TemplateWorkout), exercises: [] },
    }));
  }

  async function removeWorkout(day: number) {
    const current = workouts[day];
    if (!current) return;
    const { error } = await supabase.from("template_workouts").delete().eq("id", current.id);
    if (error) {
      toast({ title: "Couldn't delete workout.", variant: "danger" });
      return;
    }
    setWorkouts((prev) => ({ ...prev, [day]: null }));
  }

  function updateWorkoutLocal(day: number, patch: Partial<TemplateWorkout>) {
    setWorkouts((prev) => {
      const w = prev[day];
      if (!w) return prev;
      return { ...prev, [day]: { ...w, ...patch } };
    });
  }

  async function saveWorkoutHeader(day: number) {
    const w = workouts[day];
    if (!w) return;
    await supabase
      .from("template_workouts")
      .update({ name: w.name, description: w.description })
      .eq("id", w.id);
  }

  async function addExercise(day: number) {
    const w = workouts[day];
    if (!w) return;
    const position = (w.exercises.length || 0) + 1;
    const { data, error } = await supabase
      .from("template_exercises")
      .insert({
        template_workout_id: w.id,
        position,
        name: "New exercise",
        ...blankExercise(),
      } as any)
      .select()
      .single();
    if (error || !data) {
      toast({ title: "Couldn't add exercise.", description: error?.message, variant: "danger" });
      return;
    }
    setWorkouts((prev) => ({
      ...prev,
      [day]: {
        ...w,
        exercises: [...w.exercises, { ...(data as TemplateExercise), _id: data.id }],
      },
    }));
  }

  async function updateExercise(
    day: number,
    exerciseId: string,
    patch: Partial<TemplateExercise>,
  ) {
    setWorkouts((prev) => {
      const w = prev[day];
      if (!w) return prev;
      return {
        ...prev,
        [day]: {
          ...w,
          exercises: w.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)),
        },
      };
    });
    const cleaned: any = { ...patch };
    if (cleaned.video_url === "") cleaned.video_url = null;
    if (cleaned.reps === "") cleaned.reps = null;
    if (cleaned.load === "") cleaned.load = null;
    if (cleaned.tempo === "") cleaned.tempo = null;
    if (cleaned.notes === "") cleaned.notes = null;
    await supabase.from("template_exercises").update(cleaned).eq("id", exerciseId);
  }

  async function deleteExercise(day: number, exerciseId: string) {
    await supabase.from("template_exercises").delete().eq("id", exerciseId);
    setWorkouts((prev) => {
      const w = prev[day];
      if (!w) return prev;
      return {
        ...prev,
        [day]: { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) },
      };
    });
  }

  async function moveExercise(day: number, exerciseId: string, direction: -1 | 1) {
    const w = workouts[day];
    if (!w) return;
    const idx = w.exercises.findIndex((e) => e.id === exerciseId);
    const swapWith = idx + direction;
    if (idx < 0 || swapWith < 0 || swapWith >= w.exercises.length) return;
    const next = [...w.exercises];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    const reordered = next.map((e, i) => ({ ...e, position: i + 1 }));
    setWorkouts((prev) => ({ ...prev, [day]: { ...w, exercises: reordered } }));
    await Promise.all(
      reordered.map((e) =>
        supabase.from("template_exercises").update({ position: e.position }).eq("id", e.id),
      ),
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Template details</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="t-description">Description</Label>
            <Textarea
              id="t-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full overflow-x-auto">
          {DAYS_FULL.map((label, i) => (
            <TabsTrigger key={i} value={String(i)} className="flex-1">
              <span className="md:hidden">{label.slice(0, 3)}</span>
              <span className="hidden md:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS_FULL.map((label, day) => (
          <TabsContent key={day} value={String(day)} className="space-y-3">
            {workouts[day] ? (
              <Card>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                  <button
                    type="button"
                    onClick={() => removeWorkout(day)}
                    className="text-xs text-danger hover:text-danger/80"
                  >
                    Remove workout
                  </button>
                </CardHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Workout name</Label>
                    <Input
                      value={workouts[day]!.name}
                      onChange={(e) => updateWorkoutLocal(day, { name: e.target.value })}
                      onBlur={() => saveWorkoutHeader(day)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={workouts[day]!.description ?? ""}
                      onChange={(e) => updateWorkoutLocal(day, { description: e.target.value })}
                      onBlur={() => saveWorkoutHeader(day)}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">
                      Exercises
                    </p>
                    <Button size="sm" variant="outline" onClick={() => addExercise(day)}>
                      <Plus className="h-3 w-3" />
                      Add exercise
                    </Button>
                  </div>
                  {workouts[day]!.exercises.length === 0 ? (
                    <p className="text-sm text-text-secondary">No exercises yet.</p>
                  ) : (
                    workouts[day]!.exercises.map((ex, idx) => (
                      <ExerciseEditor
                        key={ex.id}
                        exercise={ex}
                        index={idx + 1}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < workouts[day]!.exercises.length - 1}
                        onChange={(patch) => updateExercise(day, ex.id, patch)}
                        onDelete={() => deleteExercise(day, ex.id)}
                        onMove={(dir) => moveExercise(day, ex.id, dir)}
                      />
                    ))
                  )}
                </div>
              </Card>
            ) : (
              <Card className="text-center">
                <p className="mb-3 text-sm text-text-secondary">No workout on {label}.</p>
                <Button onClick={() => addWorkoutForDay(day)}>
                  <Plus className="h-4 w-4" />
                  Add workout
                </Button>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ExerciseEditor({
  exercise,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onDelete,
  onMove,
}: {
  exercise: EditableExercise;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (patch: Partial<TemplateExercise>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState<string>(exercise.sets?.toString() ?? "");
  const [reps, setReps] = useState(exercise.reps ?? "");
  const [load, setLoad] = useState(exercise.load ?? "");
  const [tempo, setTempo] = useState(exercise.tempo ?? "");
  const [rest, setRest] = useState<string>(exercise.rest_seconds?.toString() ?? "");
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const [video, setVideo] = useState(exercise.video_url ?? "");

  function flush(patch: Partial<TemplateExercise>) {
    onChange(patch);
  }

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-text-secondary">#{index}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
            className={cn(
              "rounded-full p-1",
              canMoveUp
                ? "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                : "text-text-secondary/40",
            )}
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
            className={cn(
              "rounded-full p-1",
              canMoveDown
                ? "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                : "text-text-secondary/40",
            )}
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-1 text-text-secondary hover:bg-surface-2 hover:text-danger"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Input
        value={name}
        placeholder="Exercise name"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== exercise.name && flush({ name })}
        className="h-9"
      />

      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div>
          <Label>Sets</Label>
          <Input
            value={sets}
            type="number"
            inputMode="numeric"
            placeholder="3"
            onChange={(e) => setSets(e.target.value)}
            onBlur={() => {
              const v = sets === "" ? null : Number(sets);
              if (v !== exercise.sets) flush({ sets: v });
            }}
            className="h-9"
          />
        </div>
        <div>
          <Label>Reps</Label>
          <Input
            value={reps}
            placeholder="8-10"
            onChange={(e) => setReps(e.target.value)}
            onBlur={() => reps !== (exercise.reps ?? "") && flush({ reps: reps || null })}
            className="h-9"
          />
        </div>
        <div>
          <Label>Load</Label>
          <Input
            value={load}
            placeholder="bodyweight"
            onChange={(e) => setLoad(e.target.value)}
            onBlur={() => load !== (exercise.load ?? "") && flush({ load: load || null })}
            className="h-9"
          />
        </div>
        <div>
          <Label>Tempo</Label>
          <Input
            value={tempo}
            placeholder="3-0-1"
            onChange={(e) => setTempo(e.target.value)}
            onBlur={() => tempo !== (exercise.tempo ?? "") && flush({ tempo: tempo || null })}
            className="h-9"
          />
        </div>
        <div>
          <Label>Rest (sec)</Label>
          <Input
            value={rest}
            type="number"
            inputMode="numeric"
            placeholder="60"
            onChange={(e) => setRest(e.target.value)}
            onBlur={() => {
              const v = rest === "" ? null : Number(rest);
              if (v !== exercise.rest_seconds) flush({ rest_seconds: v });
            }}
            className="h-9"
          />
        </div>
        <div className="col-span-2 md:col-span-3">
          <Label>Video URL</Label>
          <Input
            value={video}
            placeholder="https://..."
            onChange={(e) => setVideo(e.target.value)}
            onBlur={() =>
              video !== (exercise.video_url ?? "") && flush({ video_url: video || null })
            }
            className="h-9"
          />
        </div>
      </div>

      <div className="mt-2">
        <Label>Notes</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (exercise.notes ?? "") && flush({ notes: notes || null })}
        />
      </div>
    </div>
  );
}
