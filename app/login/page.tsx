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
      toast({ title: "Couldn't send link.", description: error.message, variant: "danger" });
      return;
    }
    setSent(true);
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <div className="relative h-[36vh] min-h-[240px] w-full overflow-hidden">
        <Image
          src="/brand/calixia_helmet_hero.png"
          alt="Calixia"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
      </div>

      <div className="-mt-12 flex flex-1 flex-col items-center px-6">
        <Image
          src="/brand/calixia_wordmark.png"
          alt="Calixia"
          width={140}
          height={140}
          className="rounded-2xl"
          priority
        />
        <p className="mt-2 max-w-xs text-center text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Calisthenics · Xtended · Intelligent · Assistant
        </p>

        <div className="mt-10 w-full max-w-sm">
          {sent ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <Mail className="mx-auto h-6 w-6 text-accent" strokeWidth={1.5} />
              <p className="mt-3 text-text-primary">Check your email.</p>
              <p className="mt-1 text-sm text-text-secondary">
                We sent a sign-in link to {getValues("email")}.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-accent hover:text-accent-hover"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                ) : null}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send sign-in link"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-center text-[11px] text-text-secondary">
                Invite-only. Your trainer has to add you first.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
