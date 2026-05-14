// scripts/set-trainer.ts
// One-shot script: writes TRAINER_EMAIL from .env into the app_settings table.
// Run after applying the migration so the handle_new_user trigger knows
// which incoming auth user should be flagged as the trainer.
//
//   npx tsx scripts/set-trainer.ts
//
// Requires SUPABASE_SERVICE_ROLE_KEY (server-side) and NEXT_PUBLIC_SUPABASE_URL.

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.TRAINER_EMAIL;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (!email) {
    console.error("Missing TRAINER_EMAIL. Set it in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "trainer_email", value: email });

  if (error) {
    console.error("Failed to upsert app_settings:", error.message);
    process.exit(1);
  }

  // Optional: if a profile already exists for that email, promote it to trainer.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id,role,email")
    .eq("email", email)
    .maybeSingle();

  if (existing && existing.role !== "trainer") {
    const { error: roleErr } = await supabase
      .from("profiles")
      .update({ role: "trainer" })
      .eq("id", existing.id);
    if (roleErr) {
      console.error("Couldn't promote existing profile:", roleErr.message);
      process.exit(1);
    }
    console.log(`Promoted existing profile (${email}) to trainer.`);
  }

  console.log(`OK — trainer_email set to ${email}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
