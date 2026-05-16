"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Ring } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { mealSchema, type MealInput } from "@/lib/validations";
import type { Meal, MealType } from "@/types/database.types";

const SECTIONS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snacks" },
];

type Targets = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export function NutritionDay({
  clientId,
  date,
  meals,
  targets,
}: {
  clientId: string;
  date: string;
  meals: Meal[];
  targets: Targets;
}) {
  const router = useRouter();
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="space-y-4">
      <Card variant="elevated" className="overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(95,246,240,0.08),transparent_60%)]" />
        <div className="relative">
          <CardHeader>
            <CardTitle>Daily totals</CardTitle>
          </CardHeader>
          {targets.calories ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Ring
                value={totals.calories}
                max={targets.calories}
                size={120}
                stroke={10}
                tone="accent"
                label={`${totals.calories}`}
                sublabel={`/ ${targets.calories} kcal`}
              />
              <div className="grid w-full flex-1 grid-cols-3 gap-3 sm:grid-cols-3">
                <MacroBar
                  label="Protein"
                  value={totals.protein}
                  target={targets.protein}
                  tone="success"
                />
                <MacroBar
                  label="Carbs"
                  value={totals.carbs}
                  target={targets.carbs}
                  tone="ember"
                />
                <MacroBar
                  label="Fat"
                  value={totals.fat}
                  target={targets.fat}
                  tone="warning"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="Calories"
                value={totals.calories}
                target={targets.calories}
                suffix=""
              />
              <Stat
                label="Protein"
                value={totals.protein}
                target={targets.protein}
                suffix="g"
              />
              <Stat
                label="Carbs"
                value={totals.carbs}
                target={targets.carbs}
                suffix="g"
              />
              <Stat
                label="Fat"
                value={totals.fat}
                target={targets.fat}
                suffix="g"
              />
            </div>
          )}
        </div>
      </Card>

      {SECTIONS.map(({ type, label }) => {
        const sectionMeals = meals.filter((m) => m.meal_type === type);
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <AddMealDialog
                clientId={clientId}
                date={date}
                defaultType={type}
              />
            </CardHeader>
            {sectionMeals.length === 0 ? (
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Nothing logged
              </p>
            ) : (
              <div className="space-y-2">
                {sectionMeals.map((m) => (
                  <MealRow
                    key={m.id}
                    meal={m}
                    onDeleted={() => router.refresh()}
                  />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  tone,
}: {
  label: string;
  value: number;
  target: number | null;
  tone: "accent" | "success" | "ember" | "warning";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
          {label}
        </p>
        <p className="font-mono-num text-[11px] text-text-secondary">
          <span className="text-text-primary">{value}</span>
          {target ? ` / ${target}` : ""}g
        </p>
      </div>
      <Progress
        value={value}
        max={target ?? (value || 1)}
        className="mt-1.5"
        tone={tone}
        size="sm"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  target,
  suffix,
}: {
  label: string;
  value: number;
  target: number | null;
  suffix: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono-num text-lg text-text-primary">
        {value}
        {suffix}
        {target ? (
          <span className="text-sm text-text-muted">
            {" "}
            / {target}
            {suffix}
          </span>
        ) : null}
      </p>
      {target ? (
        <Progress value={value} max={target} className="mt-2" size="sm" />
      ) : null}
    </div>
  );
}

function MealRow({
  meal,
  onDeleted,
}: {
  meal: Meal;
  onDeleted: () => void;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", meal.id);
      if (error) {
        toast({ title: "Couldn't delete meal.", variant: "danger" });
        return;
      }
      onDeleted();
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2/40 p-3 transition-colors hover:bg-surface-2/70">
      {meal.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meal.photo_url}
          alt=""
          className="h-12 w-12 rounded-xl object-cover ring-1 ring-inset ring-border"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-text-primary">{meal.description}</p>
        <p className="mt-0.5 font-mono-num text-[11px] text-text-muted">
          {meal.calories ?? "—"} kcal
          <span className="text-text-secondary">
            {" "}
            · {meal.protein_g ?? 0}g pro
            {meal.carbs_g != null ? ` · ${meal.carbs_g}g carb` : ""}
            {meal.fat_g != null ? ` · ${meal.fat_g}g fat` : ""}
          </span>
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        aria-label="Delete meal"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddMealDialog({
  clientId,
  date,
  defaultType,
}: {
  clientId: string;
  date: string;
  defaultType: MealType;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealInput>({
    resolver: zodResolver(mealSchema),
    defaultValues: { meal_type: defaultType, description: "" },
  });

  async function onSubmit(values: MealInput) {
    setSubmitting(true);
    let photo_url: string | null = null;
    if (file) {
      const path = `${clientId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("meal-photos")
        .upload(path, file, { upsert: false });
      if (upErr) {
        toast({
          title: "Photo upload failed.",
          description: upErr.message,
          variant: "danger",
        });
        setSubmitting(false);
        return;
      }
      const { data: pub } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(path);
      photo_url = pub.publicUrl;
    }

    const { error } = await supabase.from("meals").insert({
      client_id: clientId,
      meal_date: date,
      meal_type: values.meal_type,
      description: values.description,
      calories: values.calories ?? null,
      protein_g: values.protein_g ?? null,
      carbs_g: values.carbs_g ?? null,
      fat_g: values.fat_g ?? null,
      photo_url,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Couldn't log meal.",
        description: error.message,
        variant: "danger",
      });
      return;
    }
    reset();
    setFile(null);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-accent transition-all hover:border-accent/60 hover:bg-accent/15 hover:shadow-glow-sm"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input
            type="hidden"
            {...register("meal_type")}
            value={defaultType}
          />
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-danger">
                {errors.description.message}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                inputMode="numeric"
                {...register("calories")}
              />
            </div>
            <div>
              <Label htmlFor="protein_g">Protein (g)</Label>
              <Input
                id="protein_g"
                type="number"
                inputMode="numeric"
                {...register("protein_g")}
              />
            </div>
            <div>
              <Label htmlFor="carbs_g">Carbs (g)</Label>
              <Input
                id="carbs_g"
                type="number"
                inputMode="numeric"
                {...register("carbs_g")}
              />
            </div>
            <div>
              <Label htmlFor="fat_g">Fat (g)</Label>
              <Input
                id="fat_g"
                type="number"
                inputMode="numeric"
                {...register("fat_g")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="photo">Photo (optional)</Label>
            <label
              htmlFor="photo"
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2/40 text-xs text-text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
            >
              <Camera className="h-4 w-4" />
              {file ? file.name : "Choose a photo"}
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save meal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
