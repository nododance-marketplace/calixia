"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function NewTemplateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }
    const { data, error } = await supabase
      .from("week_templates")
      .insert({ trainer_id: user.id, name, description: description || null })
      .select()
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast({ title: "Couldn't create template.", description: error?.message, variant: "danger" });
      return;
    }
    router.push(`/admin/templates/${data.id}`);
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Foundations — Week 2"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
          {submitting ? "Creating..." : "Create template"}
        </Button>
      </form>
    </Card>
  );
}
