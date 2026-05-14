"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { inviteClientSchema, type InviteClientInput } from "@/lib/validations";
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
      toast({ title: "Couldn't send invite.", description: result.error, variant: "danger" });
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
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
          {errors.full_name ? (
            <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending..." : "Send invite"}
        </Button>
        <p className="text-center text-[11px] text-text-secondary">
          They'll get a magic-link email. One click and they're in.
        </p>
      </form>
    </Card>
  );
}
