"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { macrosSchema, type MacrosInput } from "@/lib/validations";

export function MacrosForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: MacrosInput;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm<MacrosInput>({
    resolver: zodResolver(macrosSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: MacrosInput) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        daily_calorie_target: values.daily_calorie_target ?? null,
        daily_protein_target_g: values.daily_protein_target_g ?? null,
        daily_carbs_target_g: values.daily_carbs_target_g ?? null,
        daily_fat_target_g: values.daily_fat_target_g ?? null,
      })
      .eq("id", clientId);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save targets.", description: error.message, variant: "danger" });
      return;
    }
    toast({ title: "Targets saved.", variant: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="daily_calorie_target">Calories</Label>
          <Input
            id="daily_calorie_target"
            type="number"
            inputMode="numeric"
            {...register("daily_calorie_target")}
          />
        </div>
        <div>
          <Label htmlFor="daily_protein_target_g">Protein (g)</Label>
          <Input
            id="daily_protein_target_g"
            type="number"
            inputMode="numeric"
            {...register("daily_protein_target_g")}
          />
        </div>
        <div>
          <Label htmlFor="daily_carbs_target_g">Carbs (g)</Label>
          <Input
            id="daily_carbs_target_g"
            type="number"
            inputMode="numeric"
            {...register("daily_carbs_target_g")}
          />
        </div>
        <div>
          <Label htmlFor="daily_fat_target_g">Fat (g)</Label>
          <Input
            id="daily_fat_target_g"
            type="number"
            inputMode="numeric"
            {...register("daily_fat_target_g")}
          />
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save targets"}
      </Button>
    </form>
  );
}
