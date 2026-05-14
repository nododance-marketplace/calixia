import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { addDays, formatDateIso, timeAgo } from "@/lib/utils";
import { MacrosForm } from "./macros-form";
import { TrainerNotesForm } from "./notes-form";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("role", "client")
    .maybeSingle();

  if (!client) notFound();

  const today = new Date();
  const past14 = formatDateIso(addDays(today, -14));
  const next7 = formatDateIso(addDays(today, 7));

  const [{ data: recentCompleted }, { data: workouts }, { data: meals }] = await Promise.all([
    supabase
      .from("scheduled_workouts")
      .select("id,name,difficulty_rating,client_comment,completed_at,scheduled_date")
      .eq("client_id", client.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("scheduled_workouts")
      .select("id,name,status,scheduled_date,difficulty_rating")
      .eq("client_id", client.id)
      .gte("scheduled_date", past14)
      .lte("scheduled_date", next7)
      .order("scheduled_date"),
    supabase
      .from("meals")
      .select("id,meal_date,description,calories,protein_g,meal_type")
      .eq("client_id", client.id)
      .gte("meal_date", past14)
      .order("meal_date", { ascending: false })
      .limit(40),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/clients"
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-text-secondary">Client</p>
          <h1 className="truncate text-2xl text-text-primary">
            {client.full_name ?? client.email}
          </h1>
          <p className="truncate text-xs text-text-secondary">{client.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/messages/${client.id}`}>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          </Link>
          <Link href={`/admin/clients/${client.id}/calendar`}>
            <Button size="sm">
              <Calendar className="h-4 w-4" />
              Assign workouts
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Height" value={client.height_cm ? `${client.height_cm} cm` : "—"} />
              <Field
                label="Starting weight"
                value={
                  client.starting_weight_kg ? `${client.starting_weight_kg} kg` : "—"
                }
              />
              <Field label="Goals" value={client.goals ?? "—"} span={2} />
              <Field
                label="Training history"
                value={client.training_history ?? "—"}
                span={2}
              />
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily targets</CardTitle>
            </CardHeader>
            <MacrosForm
              clientId={client.id}
              initial={{
                daily_calorie_target: client.daily_calorie_target,
                daily_protein_target_g: client.daily_protein_target_g,
                daily_carbs_target_g: client.daily_carbs_target_g,
                daily_fat_target_g: client.daily_fat_target_g,
              }}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent feedback</CardTitle>
            </CardHeader>
            {!recentCompleted || recentCompleted.length === 0 ? (
              <p className="text-sm text-text-secondary">No completed workouts yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentCompleted.map((w) => (
                  <li key={w.id} className="rounded-2xl border border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-primary">{w.name}</p>
                      <span className="text-xs text-text-secondary">
                        {w.completed_at ? timeAgo(w.completed_at) : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                      {w.difficulty_rating ? (
                        <Badge variant="muted">{w.difficulty_rating}/5</Badge>
                      ) : null}
                      {w.client_comment ? <span>"{w.client_comment}"</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-2">
          {!workouts || workouts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center text-sm text-text-secondary">
              No scheduled workouts in this window.
            </p>
          ) : (
            workouts.map((w) => (
              <Link
                key={w.id}
                href={`/admin/clients/${client.id}/workout/${w.id}`}
                className="block"
              >
                <Card className="hover:bg-surface-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-primary">{w.name}</p>
                      <p className="text-xs text-text-secondary">{w.scheduled_date}</p>
                    </div>
                    <Badge
                      variant={
                        w.status === "completed"
                          ? "success"
                          : w.status === "skipped"
                            ? "danger"
                            : "muted"
                      }
                    >
                      {w.status}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-2">
          {!meals || meals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center text-sm text-text-secondary">
              No meals logged in the last 14 days.
            </p>
          ) : (
            meals.map((m) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">{m.description}</p>
                    <p className="text-[11px] text-text-secondary">
                      {m.meal_date} · {m.meal_type} · {m.calories ?? "—"} kcal ·{" "}
                      {m.protein_g ?? 0}g protein
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Trainer notes (private)</CardTitle>
            </CardHeader>
            <TrainerNotesForm clientId={client.id} initial={client.trainer_notes ?? ""} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  value,
  span = 1,
}: {
  label: string;
  value: string;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-text-primary whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
