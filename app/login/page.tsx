"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, type EmailInput } from "@/lib/validations";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  async function onSubmit(values: EmailInput) {
    setSubmitting(true);
    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Couldn't send link.",
        description: error.message,
        variant: "danger",
      });
      return;
    }
    setSent(true);
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Hero image with gradient overlays */}
      <div className="relative h-[44vh] min-h-[280px] w-full overflow-hidden">
        <Image
          src="/brand/calixia_helmet_hero.png"
          alt=""
          fill
          priority
          className="object-cover object-center scale-105 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        {/* Subtle radial accent */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(95,246,240,0.16),transparent_60%)]" />
      </div>

      {/* Wordmark over hero */}
      <div className="relative -mt-24 flex flex-col items-center px-6">
        <Image
          src="/brand/calixia_wordmark_transparent.png"
          alt="Calixia"
          width={420}
          height={126}
          priority
          className="h-auto w-[300px] sm:w-[380px] drop-shadow-[0_0_32px_rgba(95,246,240,0.25)] animate-slide-up"
        />
        <p className="mt-5 max-w-xs text-center text-[10px] uppercase tracking-[0.32em] text-text-secondary animate-fade-in">
          Calisthenics <span className="text-text-muted">·</span> Xtended{" "}
          <span className="text-text-muted">·</span> Intelligent{" "}
          <span className="text-text-muted">·</span> Assistant
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-12">
        <div className="w-full max-w-sm animate-slide-up-lg">
          {sent ? (
            <div className="glass relative overflow-hidden rounded-3xl p-7 text-center shadow-elevated">
              <div className="pointer-events-none absolute inset-x-0 -top-6 h-24 bg-hero-radial" />
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
                <Mail className="h-5 w-5 text-accent" strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-display text-lg text-text-primary">
                Check your email
              </p>
              <p className="mt-1.5 text-sm text-text-secondary">
                We sent a sign-in link to{" "}
                <span className="text-text-primary">{getValues("email")}</span>.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-5 text-xs uppercase tracking-[0.2em] text-accent hover:text-accent-hover"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="mt-1.5 text-[11px] uppercase tracking-wide text-danger">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send sign-in link"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Invite-only · Your coach adds you first
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
