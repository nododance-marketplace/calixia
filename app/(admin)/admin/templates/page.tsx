import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("week_templates")
    .select("id, name, description, template_workouts(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">Trainer</p>
          <h1 className="mt-1 text-2xl text-text-primary">Templates</h1>
        </div>
        <Link href="/admin/templates/new">
          <Button>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        </Link>
      </div>

      {!templates || templates.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="No templates yet"
          description="Build a reusable week, then assign it to a client."
          action={
            <Link href="/admin/templates/new">
              <Button>
                <Plus className="h-4 w-4" />
                New template
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Link key={t.id} href={`/admin/templates/${t.id}`}>
              <Card className="hover:bg-surface-2">
                <p className="text-text-primary">{t.name}</p>
                {t.description ? (
                  <p className="mt-1 text-xs text-text-secondary line-clamp-2">{t.description}</p>
                ) : null}
                <p className="mt-3 text-xs text-text-secondary">
                  {t.template_workouts?.length ?? 0} workouts
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
