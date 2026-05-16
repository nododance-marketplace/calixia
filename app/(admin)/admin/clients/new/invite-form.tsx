"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  inviteClientSchema,
  type InviteClientInput,
} from "@/lib/validations";
import { inviteClient } from "./actions";

export function InviteClientForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteClientInput>({
    resolver: zodResolver(inviteClientSchema),
  });

  async function onSubmit(values: InviteClientInput) {
    setSubmitting(true);
    const result = await inviteClient(values);
    setSubmitting(false);
    if (!result.ok) {
      toast({
        title: "Couldn't send invite.",
        description: result.error,
        variant: "danger",
      });
      return;
    }
    toast({
      title: "Invite sent.",
      description: `${values.email} will receive a magic-link email.`,
      variant: "success",
    });
    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_0%,rgba(95,246,240,0.07),transparent_60%)]" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative space-y-4"
      >
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            {...register("full_name")}
          />
          {errors.full_name ? (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-danger">
              {errors.full_name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-danger">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Sending..." : "Send invite"}
          {!submitting && <Send className="h-4 w-4" />}
        </Button>
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Magic-link email · one click in
        </p>
      </form>
    </Card>
  );
}
