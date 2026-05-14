"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { addDays, cn, DAYS_SHORT, formatDateIso, startOfWeekMonday } from "@/lib/utils";
import { assignTemplate } from "./actions";

type TemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  template_workouts: { id: string; name: string; day_of_week: number }[];
};

type AssignedDay = {
  id: string;
  name: string;
  scheduled_date: string;
  status: string;
};

export function AssignCalendar({
  clientId,
  visibleMonth,
  templates,
  assigned,
}: {
  clientId: string;
  visibleMonth: string;
  templates: TemplateSummary[];
  assigned: AssignedDay[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    templates[0]?.id ?? null,
  );
  const [pending, startTransition] = useTransition();

  const month = useMemo(() => new Date(visibleMonth), [visibleMonth]);
  const monthStart = useMemo(
    () => new Date(month.getFullYear(), month.getMonth(), 1),
    [month],
  );
  const gridStart = startOfWeekMonday(monthStart);

  const cells = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      return {
        date: d,
        iso: formatDateIso(d),
        inMonth: d.getMonth() === month.getMonth(),
      };
    });
  }, [gridStart, month]);

  const assignedByDate = useMemo(() => {
    const map: Record<string, AssignedDay> = {};
    for (const a of assigned) map[a.scheduled_date] = a;
    return map;
  }, [assigned]);

  function shiftMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const param = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    router.push(`?month=${param}`);
  }

  async function onCellClick(date: Date) {
    if (date.getDay() !== 1) {
      toast({
        title: "Pick a Monday.",
        description: "Templates assign Monday → Sunday.",
      });
      return;
    }
    if (!selectedTemplate) {
      toast({ title: "Pick a template first.", variant: "danger" });
      return;
    }
    startTransition(async () => {
      const result = await assignTemplate({
        clientId,
        templateId: selectedTemplate,
        weekStart: formatDateIso(date),
      });
      if (!result.ok) {
        toast({
          title: "Couldn't assign.",
          description: result.error,
          variant: "danger",
        });
        return;
      }
      toast({
        title: "Week assigned.",
        description:
          result.skipped > 0
            ? `${result.created} added, ${result.skipped} already had a workout.`
            : `${result.created} workouts scheduled.`,
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_280px]">
      <Card>
        <CardHeader>
          <CardTitle>
            {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-full p-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-full p-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wide text-text-secondary">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="px-1 py-1 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, iso, inMonth }) => {
            const a = assignedByDate[iso];
            const isMonday = date.getDay() === 1;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => void onCellClick(date)}
                disabled={pending || !isMonday}
                className={cn(
                  "flex aspect-square flex-col items-stretch justify-between rounded-2xl border p-1.5 text-left text-xs transition-colors",
                  inMonth ? "border-border bg-background/30" : "border-transparent opacity-40",
                  isMonday && inMonth
                    ? "hover:border-accent/60 hover:bg-accent/5"
                    : "cursor-not-allowed",
                )}
              >
                <span className={inMonth ? "text-text-primary" : "text-text-secondary"}>
                  {date.getDate()}
                </span>
                {a ? (
                  <span
                    className={cn(
                      "mt-1 truncate rounded-full px-1.5 py-0.5 text-[9px]",
                      a.status === "completed"
                        ? "bg-success/20 text-success"
                        : a.status === "skipped"
                          ? "bg-danger/20 text-danger"
                          : "bg-accent/20 text-accent",
                    )}
                  >
                    {a.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">
          Tap any Monday to assign the selected template for that week.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        {templates.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No templates yet.{" "}
            <a href="/admin/templates/new" className="text-accent">
              Create one
            </a>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm",
                    selectedTemplate === t.id
                      ? "border-accent bg-accent/5 text-text-primary"
                      : "border-border bg-background/30 text-text-secondary hover:border-accent/40 hover:text-text-primary",
                  )}
                >
                  <Layers className="h-4 w-4 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{t.name}</p>
                    <p className="text-[11px] text-text-secondary">
                      {t.template_workouts?.length ?? 0} workouts
                    </p>
                  </div>
                  {selectedTemplate === t.id ? (
                    <Badge variant="accent">selected</Badge>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
