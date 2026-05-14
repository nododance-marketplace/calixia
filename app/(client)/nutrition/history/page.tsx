import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { addDays, formatDateIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NutritionHistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const start = addDays(today, -13);

  const [{ data: profile }, { data: meals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_target,daily_protein_target_g")
      .eq("id", user.id)
      .single(),
    supabase
      .from("meals")
      .select("meal_date,calories,protein_g,carbs_g,fat_g")
      .eq("client_id", user.id)
      .gte("meal_date", formatDateIso(start))
      .lte("meal_date", formatDateIso(today)),
  ]);

  type DayTotals = { calories: number; protein: number };
  const byDay: Record<string, DayTotals> = {};
  for (const m of meals ?? []) {
    byDay[m.meal_date] = byDay[m.meal_date] ?? { calories: 0, protein: 0 };
    byDay[m.meal_date].calories += m.calories ?? 0;
    byDay[m.meal_date].protein += m.protein_g ?? 0;
  }

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, -i);
    const iso = formatDateIso(d);
    return { d, iso, t: byDay[iso] ?? { calories: 0, protein: 0 } };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/nutrition"
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl text-text-primary">Last 14 days</h1>
      </div>

      <div className="space-y-2">
        {days.map(({ d, iso, t }) => {
          const calOk =
            profile?.daily_calorie_target && t.calories >= profile.daily_calorie_target * 0.9;
          const proOk =
            profile?.daily_protein_target_g && t.protein >= profile.daily_protein_target_g * 0.9;
          return (
            <Card key={iso} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">{format(d, "EEE, MMM d")}</p>
                  <p className="text-xs text-text-secondary">
                    {t.calories} kcal · {t.protein}g protein
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {calOk ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" /> cal
                    </span>
                  ) : null}
                  {proOk ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" /> protein
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
