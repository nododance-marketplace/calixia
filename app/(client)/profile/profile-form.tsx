"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import type { Profile } from "@/types/database.types";
import { initials } from "@/lib/utils";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      goals: profile?.goals ?? "",
      height_cm: profile?.height_cm ?? null,
      starting_weight_kg: profile?.starting_weight_kg ?? null,
      training_history: profile?.training_history ?? "",
    },
  });

  async function onSubmit(values: ProfileInput) {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name ?? null,
        goals: values.goals ?? null,
        height_cm: values.height_cm ?? null,
        starting_weight_kg: values.starting_weight_kg ?? null,
        training_history: values.training_history ?? null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({
        title: "Couldn't save profile.",
        description: error.message,
        variant: "danger",
      });
      return;
    }
    toast({ title: "Profile saved.", variant: "success" });
    router.refresh();
  }

  async function onAvatarChange(file: File) {
    if (!profile) return;
    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false });
    if (upErr) {
      toast({
        title: "Upload failed.",
        description: upErr.message,
        variant: "danger",
      });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", profile.id);
    setUploading(false);
    if (error) {
      toast({ title: "Couldn't save avatar.", variant: "danger" });
      return;
    }
    setAvatarUrl(pub.publicUrl);
    router.refresh();
  }

  if (!profile) return null;

  return (
    <div className="space-y-5 pb-2 animate-fade-in">
      <div className="pt-2 animate-slide-up">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          Profile
        </p>
        <h1 className="mt-2 font-display text-display-md text-text-primary">
          Your details
        </h1>
      </div>

      <Card variant="elevated" className="overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_0%,rgba(95,246,240,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-inset ring-accent/25">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl text-accent/70">
                {initials(profile.full_name ?? profile.email)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-text-primary truncate">
              {profile.full_name ?? profile.email}
            </p>
            <p className="text-xs text-text-muted truncate">{profile.email}</p>
            <label
              htmlFor="avatar"
              className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-accent-hover"
            >
              <Camera className="h-3 w-3" />
              {uploading ? "Uploading…" : "Change photo"}
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onAvatarChange(file);
              }}
            />
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
            </div>
            <div>
              <Label htmlFor="goals">Goals</Label>
              <Textarea id="goals" rows={3} {...register("goals")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  inputMode="numeric"
                  step="0.1"
                  {...register("height_cm")}
                />
              </div>
              <div>
                <Label htmlFor="starting_weight_kg">Starting weight (kg)</Label>
                <Input
                  id="starting_weight_kg"
                  type="number"
                  inputMode="numeric"
                  step="0.1"
                  {...register("starting_weight_kg")}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="training_history">Training history</Label>
              <Textarea
                id="training_history"
                rows={3}
                {...register("training_history")}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily targets</CardTitle>
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Set by your coach
            </span>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <ReadOnly
              label="Calories"
              value={profile.daily_calorie_target}
              suffix=""
            />
            <ReadOnly
              label="Protein"
              value={profile.daily_protein_target_g}
              suffix="g"
            />
            <ReadOnly
              label="Carbs"
              value={profile.daily_carbs_target_g}
              suffix="g"
            />
            <ReadOnly
              label="Fat"
              value={profile.daily_fat_target_g}
              suffix="g"
            />
          </div>
        </Card>

        <Button type="submit" disabled={saving} className="w-full" size="lg">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

function ReadOnly({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono-num text-lg text-text-primary">
        {value ?? "—"}
        {value ? suffix : ""}
      </p>
    </div>
  );
}
