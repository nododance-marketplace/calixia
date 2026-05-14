import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AssignCalendar } from "./assign-calendar";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { month?: string };
}) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("id", params.id)
    .eq("role", "client")
    .maybeSingle();

  if (!client) notFound();

  const today = new Date();
  const monthParam = searchParams.month;
  const visibleMonth = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  const startIso = monthStart.toISOString().slice(0, 10);
  const endIso = monthEnd.toISOString().slice(0, 10);

  const [{ data: templates }, { data: assigned }] = await Promise.all([
    supabase
      .from("week_templates")
      .select("id,name,description, template_workouts(id, name, day_of_week)")
      .order("created_at", { ascending: false }),
    supabase
      .from("scheduled_workouts")
      .select("id,name,scheduled_date,status")
      .eq("client_id", client.id)
      .gte("scheduled_date", startIso)
      .lte("scheduled_date", endIso),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/clients/${client.id}`}
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Assign workouts
          </p>
          <h1 className="truncate text-2xl text-text-primary">
            {client.full_name ?? client.email}
          </h1>
        </div>
      </div>

      <AssignCalendar
        clientId={client.id}
        visibleMonth={monthStart.toISOString()}
        templates={(templates ?? []) as any[]}
        assigned={(assigned ?? []) as any[]}
      />
    </div>
  );
}
