"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays, formatDateIso } from "@/lib/utils";

export async function assignTemplate(input: {
  clientId: string;
  templateId: string;
  weekStart: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "trainer") return { ok: false as const, error: "Forbidden." };

  // Load template content
  const { data: templateWorkouts, error: twErr } = await supabase
    .from("template_workouts")
    .select("id, day_of_week, name, description")
    .eq("template_id", input.templateId);
  if (twErr) return { ok: false as const, error: twErr.message };
  if (!templateWorkouts?.length) {
    return { ok: false as const, error: "Template is empty." };
  }

  const twIds = templateWorkouts.map((t) => t.id);
  const { data: templateExercises } = await supabase
    .from("template_exercises")
    .select("*")
    .in("template_workout_id", twIds)
    .order("position");

  const weekStart = new Date(`${input.weekStart}T00:00:00`);

  let created = 0;
  let skipped = 0;

  for (const tw of templateWorkouts) {
    const date = addDays(weekStart, tw.day_of_week);
    const scheduledDate = formatDateIso(date);

    // Skip if a workout already exists on this date
    const { data: existing } = await supabase
      .from("scheduled_workouts")
      .select("id")
      .eq("client_id", input.clientId)
      .eq("scheduled_date", scheduledDate)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const { data: newWorkout, error: insErr } = await supabase
      .from("scheduled_workouts")
      .insert({
        client_id: input.clientId,
        scheduled_date: scheduledDate,
        name: tw.name,
        description: tw.description,
        source_template_id: input.templateId,
      })
      .select()
      .single();
    if (insErr || !newWorkout) {
      return { ok: false as const, error: insErr?.message ?? "Insert failed." };
    }

    const exercisesForWorkout = (templateExercises ?? []).filter(
      (e) => e.template_workout_id === tw.id,
    );
    if (exercisesForWorkout.length > 0) {
      const payload = exercisesForWorkout.map((e) => ({
        scheduled_workout_id: newWorkout.id,
        position: e.position,
        name: e.name,
        prescribed_sets: e.sets,
        prescribed_reps: e.reps,
        prescribed_load: e.load,
        tempo: e.tempo,
        rest_seconds: e.rest_seconds,
        notes: e.notes,
        video_url: e.video_url,
      }));
      const { error: exErr } = await supabase.from("scheduled_exercises").insert(payload);
      if (exErr) return { ok: false as const, error: exErr.message };
    }
    created += 1;
  }

  return { ok: true as const, created, skipped };
}
