import Link from "next/link";
import { Plus, Layers, ChevronRight } from "lucide-react";
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
    <div className="space-y-6 pb-2 animate-fade-in">
      <div className="flex items-end justify-between pt-2 animate-slide-up">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Trainer
          </p>
          <h1 className="mt-2 font-display text-display-lg text-text-primary">
            Templates
          </h1>
        </div>
        <Link href="/admin/templates/new">
          <Button>
            <Plus className="h-4 w-4" />
            New
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
          {templates.map((t, i) => (
            <Link key={t.id} href={`/admin/templates/${t.id}`}>
              <Card
                className="group h-full animate-slide-up transition-all hover:border-border-strong hover:shadow-glow-sm"
                style={{ animationDelay: `${i * 30}ms` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-text-primary">
                      {t.name}
                    </p>
                    {t.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                        {t.description}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 font-mono-num text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  <Layers className="h-3 w-3" />
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
