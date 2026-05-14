import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: template } = await supabase
    .from("week_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!template) notFound();

  const { data: workouts } = await supabase
    .from("template_workouts")
    .select("*")
    .eq("template_id", template.id)
    .order("day_of_week");

  const workoutIds = (workouts ?? []).map((w) => w.id);
  const { data: exercises } = workoutIds.length
    ? await supabase
        .from("template_exercises")
        .select("*")
        .in("template_workout_id", workoutIds)
        .order("position")
    : { data: [] as any[] };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/templates"
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">Template</p>
          <h1 className="text-2xl text-text-primary">{template.name}</h1>
        </div>
      </div>

      <TemplateEditor
        templateId={template.id}
        templateName={template.name}
        templateDescription={template.description ?? ""}
        initialWorkouts={(workouts ?? []).map((w) => ({
          ...w,
          exercises: (exercises ?? []).filter((e) => e.template_workout_id === w.id),
        }))}
      />
    </div>
  );
}
