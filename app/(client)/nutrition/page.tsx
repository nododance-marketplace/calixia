import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateIso } from "@/lib/utils";
import { NutritionDay } from "./nutrition-day";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = formatDateIso(new Date());

  const [{ data: profile }, { data: meals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_target,daily_protein_target_g,daily_carbs_target_g,daily_fat_target_g")
      .eq("id", user.id)
      .single(),
    supabase
      .from("meals")
      .select("*")
      .eq("client_id", user.id)
      .eq("meal_date", today)
      .order("logged_at"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">Today</p>
          <h1 className="mt-1 text-2xl text-text-primary">Nutrition</h1>
        </div>
        <Link href="/nutrition/history" className="text-xs text-accent">
          History
        </Link>
      </div>

      <NutritionDay
        clientId={user.id}
        date={today}
        meals={meals ?? []}
        targets={{
          calories: profile?.daily_calorie_target ?? null,
          protein: profile?.daily_protein_target_g ?? null,
          carbs: profile?.daily_carbs_target_g ?? null,
          fat: profile?.daily_fat_target_g ?? null,
        }}
      />
    </div>
  );
}
