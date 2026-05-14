"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { inviteClientSchema, type InviteClientInput } from "@/lib/validations";

export async function inviteClient(input: InviteClientInput) {
  const parsed = inviteClientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "trainer") return { ok: false as const, error: "Forbidden." };

  const admin = createAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`;

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
